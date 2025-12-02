import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Transaction-like wrapper for multi-step database operations.
 * 
 * PostgreSQL in Supabase doesn't expose raw BEGIN/COMMIT through the JS client,
 * so we implement a "compensating transaction" pattern:
 * 
 * 1. Execute operations in order
 * 2. If any step fails, rollback previous steps using compensation actions
 * 3. Return success only if all steps complete
 * 
 * This ensures data consistency for operations like:
 * - Upload file to storage + insert DB record
 * - Delete DB record + remove file from storage
 */

export type CompensationAction = () => Promise<void>;

export interface TransactionStep<T> {
  name: string;
  execute: () => Promise<T>;
  compensate?: (result: T) => Promise<void>;
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  failedStep?: string;
}

/**
 * Execute a series of steps with automatic rollback on failure.
 * Each step can optionally define a compensation action to undo its effects.
 */
export async function executeWithCompensation<T>(
  steps: TransactionStep<unknown>[],
  finalResult: () => T
): Promise<TransactionResult<T>> {
  const completedSteps: { step: TransactionStep<unknown>; result: unknown }[] = [];

  try {
    for (const step of steps) {
      const result = await step.execute();
      completedSteps.push({ step, result });
    }

    return {
      success: true,
      data: finalResult(),
    };
  } catch (error: unknown) {
    const failedStepName = steps[completedSteps.length]?.name || "unknown";
    
    // Rollback completed steps in reverse order
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const { step, result } = completedSteps[i];
      if (step.compensate) {
        try {
          await step.compensate(result);
        } catch (compensateError) {
          console.error(`Failed to compensate step "${step.name}":`, compensateError);
        }
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      failedStep: failedStepName,
    };
  }
}

/**
 * Helper for file upload + DB insert operations.
 * Ensures file is deleted if DB insert fails.
 */
export async function uploadFileWithRecord(
  supabase: SupabaseClient,
  options: {
    bucket: string;
    filePath: string;
    fileBuffer: Buffer;
    contentType?: string;
    insertRecord: () => Promise<{ data: unknown; error: unknown }>;
  }
): Promise<TransactionResult<unknown>> {
  let uploadedPath: string | null = null;

  return executeWithCompensation(
    [
      {
        name: "upload_file",
        execute: async () => {
          const { error } = await supabase.storage
            .from(options.bucket)
            .upload(options.filePath, options.fileBuffer, {
              contentType: options.contentType,
            });
          if (error) throw new Error(`Storage upload failed: ${error.message}`);
          uploadedPath = options.filePath;
          return options.filePath;
        },
        compensate: async () => {
          if (uploadedPath) {
            await supabase.storage.from(options.bucket).remove([uploadedPath]);
          }
        },
      },
      {
        name: "insert_record",
        execute: async () => {
          const { data, error } = await options.insertRecord();
          if (error) throw new Error(`DB insert failed: ${(error as Error).message}`);
          return data;
        },
      },
    ],
    () => ({ filePath: uploadedPath })
  );
}

/**
 * Helper for DB delete + file removal operations.
 * Attempts both operations but prioritizes DB deletion.
 */
export async function deleteRecordWithFile(
  supabase: SupabaseClient,
  options: {
    bucket: string;
    filePath: string | null;
    deleteRecord: () => Promise<{ error: unknown }>;
  }
): Promise<TransactionResult<void>> {
  return executeWithCompensation(
    [
      {
        name: "delete_record",
        execute: async () => {
          const { error } = await options.deleteRecord();
          if (error) throw new Error(`DB delete failed: ${(error as Error).message}`);
        },
      },
      {
        name: "remove_file",
        execute: async () => {
          if (options.filePath) {
            const { error } = await supabase.storage
              .from(options.bucket)
              .remove([options.filePath]);
            // Ignore "not found" errors for file removal
            if (error && !error.message.toLowerCase().includes("not found")) {
              console.warn(`File removal warning: ${error.message}`);
            }
          }
        },
      },
    ],
    () => undefined
  );
}
