-- Test data for demonstration and testing purposes
-- Requires an existing user in profiles table

DO $$
DECLARE
  test_user_id UUID;
  test_resume_id UUID;
  test_job_id_1 UUID;
  test_job_id_2 UUID;
  test_job_id_3 UUID;
  test_job_id_4 UUID;
  test_rewritten_id_1 UUID;
  test_rewritten_id_2 UUID;
  test_rewritten_id_3 UUID;
  test_rewritten_id_4 UUID;
BEGIN
  -- Get the last registered user
  SELECT id INTO test_user_id FROM public.profiles ORDER BY created_at DESC LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using test user: %', test_user_id;
  
  -- Job Posting 1: Standard Frontend Developer position
  INSERT INTO public.job_postings (id, user_id, title, company, description, link)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    'Senior Frontend Developer',
    'TechCorp Inc.',
    'We are looking for a Senior Frontend Developer with 5+ years of experience.

Requirements:
- Expert knowledge of React.js and TypeScript
- Experience with Next.js and server-side rendering
- Strong understanding of CSS, Tailwind CSS
- Experience with state management (Redux, Zustand)
- Knowledge of testing frameworks (Jest, Cypress)
- Good communication skills
- Experience with Git and CI/CD

Nice to have:
- Experience with GraphQL
- Knowledge of Docker and Kubernetes
- Contributions to open source projects

We offer:
- Competitive salary
- Remote work options
- Health insurance
- Learning budget',
    'https://example.com/jobs/frontend-developer'
  )
  RETURNING id INTO test_job_id_1;

  -- Job Posting 2: Full Stack Developer at startup
  INSERT INTO public.job_postings (id, user_id, title, company, description, link)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    'Full Stack Developer',
    'StartupXYZ',
    'Join our fast-growing startup as a Full Stack Developer!

What you will do:
- Build and maintain web applications using React and Node.js
- Design and implement RESTful APIs
- Work with PostgreSQL databases
- Collaborate with product team

Requirements:
- 3+ years of full-stack development experience
- Proficiency in JavaScript/TypeScript
- Experience with React and Node.js
- Database design experience (PostgreSQL preferred)
- Understanding of cloud services (AWS/GCP)

Benefits:
- Equity options
- Flexible hours
- Team retreats',
    'https://example.com/jobs/fullstack'
  )
  RETURNING id INTO test_job_id_2;

  -- Job Posting 3: Backend Developer without link (edge case: NULL link)
  INSERT INTO public.job_postings (id, user_id, title, company, description, link)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    'Backend Developer (Python)',
    'DataFlow Systems',
    'We need a Backend Developer to help build our data processing platform.

Responsibilities:
- Design and implement scalable backend services
- Work with large datasets and optimize performance
- Build APIs for data access
- Maintain documentation

Required skills:
- Python (FastAPI, Django)
- SQL (PostgreSQL, MySQL)
- Redis, message queues
- Docker, Linux
- Git version control

Preferred:
- Experience with data pipelines
- Knowledge of machine learning basics
- Cloud platform experience',
    NULL
  )
  RETURNING id INTO test_job_id_3;

  -- Job Posting 4: Edge case - minimal data, special characters in title
  INSERT INTO public.job_postings (id, user_id, title, company, description, link)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    'C++ / Rust Developer (Senior)',
    NULL,
    'Looking for experienced systems programmer.',
    'https://jobs.example.org/cpp-rust?ref=linkedin&utm_source=test'
  )
  RETURNING id INTO test_job_id_4;

  RAISE NOTICE 'Created 4 test job postings';

  -- Adapted Resume 1: Full data, high match (Frontend)
  INSERT INTO public.rewritten_resumes (id, user_id, job_posting_id, content, structured_data, variant, theme)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    test_job_id_1,
    'Ivan Ivanov - Senior Frontend Developer with expertise in React and TypeScript...',
    '{
      "personalInfo": {
        "name": "Ivan Ivanov",
        "title": "Senior Frontend Developer",
        "email": "ivan.ivanov@example.com",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/ivanivanov",
        "website": "ivanivanov.dev"
      },
      "sections": [
        {
          "type": "summary",
          "title": "Summary",
          "content": "Senior Frontend Developer with 6+ years of experience building scalable web applications. Expert in React.js, TypeScript, and modern frontend architecture. Passionate about creating exceptional user experiences."
        },
        {
          "type": "experience",
          "title": "Experience",
          "content": [
            {
              "title": "Senior Frontend Developer",
              "subtitle": "Previous Corp",
              "date": "2021-01 - Present",
              "description": "Remote",
              "bullets": [
                "Led migration from JavaScript to TypeScript, reducing bugs by 40%",
                "Implemented design system with Tailwind CSS used by 5 teams",
                "Mentored 3 junior developers"
              ]
            },
            {
              "title": "Frontend Developer",
              "subtitle": "Another Inc",
              "date": "2018-06 - 2020-12",
              "description": "New York, NY",
              "bullets": [
                "Built React components library used across 10+ projects",
                "Improved page load time by 60% through optimization"
              ]
            }
          ]
        },
        {
          "type": "education",
          "title": "Education",
          "content": [
            {
              "title": "B.S. Computer Science",
              "subtitle": "University of California",
              "date": "2018"
            }
          ]
        },
        {
          "type": "skills",
          "title": "Skills",
          "content": "React.js, TypeScript, Next.js, Tailwind CSS, Redux, Jest, Cypress, Git, Leadership, Communication, Problem Solving"
        }
      ]
    }'::jsonb,
    'tailored',
    'modern'
  )
  RETURNING id INTO test_rewritten_id_1;

  -- Adapted Resume 2: Medium match (Full Stack)
  INSERT INTO public.rewritten_resumes (id, user_id, job_posting_id, content, structured_data, variant, theme)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    test_job_id_2,
    'Mark Zuckerberg - Full Stack Developer proficient in React and Node.js...',
    '{
      "personalInfo": {
        "name": "Mark Zuckerberg",
        "title": "Full Stack Developer",
        "email": "mark.zuckerberg@example.com",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA"
      },
      "sections": [
        {
          "type": "summary",
          "title": "Summary",
          "content": "Full Stack Developer with strong experience in both frontend and backend technologies. Skilled in React, Node.js, and PostgreSQL."
        },
        {
          "type": "experience",
          "title": "Experience",
          "content": [
            {
              "title": "Full Stack Developer",
              "subtitle": "Tech Solutions",
              "date": "2019-01 - Present",
              "bullets": [
                "Built end-to-end features using React and Node.js",
                "Designed database schemas in PostgreSQL",
                "Deployed applications on AWS"
              ]
            }
          ]
        },
        {
          "type": "skills",
          "title": "Skills",
          "content": "React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Teamwork, Agile methodology"
        }
      ]
    }'::jsonb,
    'tailored',
    'light'
  )
  RETURNING id INTO test_rewritten_id_2;

  -- Adapted Resume 3: Low match (Backend)
  INSERT INTO public.rewritten_resumes (id, user_id, job_posting_id, content, structured_data, variant, theme)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    test_job_id_3,
    'Ya Batman - Backend Developer with Python expertise...',
    '{
      "personalInfo": {
        "name": "Ya Batman",
        "title": "Backend Developer",
        "email": "ya.batman@example.com"
      },
      "sections": [
        {
          "type": "summary",
          "title": "Summary",
          "content": "Backend Developer with experience in Python, FastAPI, and data processing systems."
        },
        {
          "type": "experience",
          "title": "Experience",
          "content": [
            {
              "title": "Backend Developer",
              "subtitle": "Data Corp",
              "date": "2020-03 - Present",
              "bullets": [
                "Built REST APIs using FastAPI",
                "Optimized database queries reducing response time by 50%"
              ]
            }
          ]
        },
        {
          "type": "skills",
          "title": "Skills",
          "content": "Python, FastAPI, PostgreSQL, Redis, Docker"
        }
      ]
    }'::jsonb,
    'tailored',
    'minimal'
  )
  RETURNING id INTO test_rewritten_id_3;

  -- Adapted Resume 4: Edge case - minimal personal info, special chars, unicode
  INSERT INTO public.rewritten_resumes (id, user_id, job_posting_id, content, structured_data, variant, theme)
  VALUES (
    gen_random_uuid(),
    test_user_id,
    test_job_id_4,
    'José García-López - C++/Rust Systems Developer...',
    '{
      "personalInfo": {
        "name": "José García-López",
        "title": "Systems Developer",
        "email": "jose.garcia@example.com",
        "phone": "",
        "location": "",
        "linkedin": "",
        "website": ""
      },
      "sections": [
        {
          "type": "summary",
          "title": "Summary",
          "content": "Experienced systems programmer specializing in C++ and Rust. Strong background in performance optimization and memory-safe programming."
        },
        {
          "type": "experience",
          "title": "Work Experience",
          "content": [
            {
              "title": "Systems Developer",
              "subtitle": "Embedded Systems Ltd.",
              "date": "2017-01 - Present",
              "bullets": [
                "Developed real-time systems in C++ with strict latency requirements (<1ms)",
                "Migrated legacy C codebase to Rust, improving memory safety",
                "Implemented lock-free data structures for concurrent processing"
              ]
            }
          ]
        },
        {
          "type": "education",
          "title": "Education",
          "content": []
        },
        {
          "type": "skills",
          "title": "Technical Skills",
          "content": "C++17/20, Rust, LLVM, CMake, Memory management, Concurrency, Linux kernel, Embedded systems"
        },
        {
          "type": "custom",
          "title": "Languages",
          "content": "English (Fluent), Spanish (Native), German (Basic)"
        }
      ]
    }'::jsonb,
    'tailored',
    'classic'
  )
  RETURNING id INTO test_rewritten_id_4;

  RAISE NOTICE 'Created 4 test rewritten resumes';

  -- Skill map 1: High match (85%) with full analysis data
  INSERT INTO public.skill_maps (user_id, rewritten_resume_id, match_score, adaptation_score, data)
  VALUES (
    test_user_id,
    test_rewritten_id_1,
    85,
    92,
    '{
      "matchScore": 85,
      "adaptationScore": 92,
      "matchedSkills": [
        {"name": "React.js", "priority": "high", "category": "matched", "matchPercentage": 100},
        {"name": "TypeScript", "priority": "high", "category": "matched", "matchPercentage": 100},
        {"name": "Next.js", "priority": "high", "category": "matched", "matchPercentage": 95},
        {"name": "Tailwind CSS", "priority": "medium", "category": "matched", "matchPercentage": 100},
        {"name": "Redux", "priority": "medium", "category": "matched", "matchPercentage": 90},
        {"name": "Jest", "priority": "medium", "category": "matched", "matchPercentage": 85}
      ],
      "transferableSkills": [
        {"name": "Leadership", "priority": "medium", "category": "transferable"},
        {"name": "CI/CD experience", "priority": "low", "category": "transferable"}
      ],
      "missingSkills": [
        {"name": "Cypress", "priority": "medium", "category": "missing", "potentialScoreIncrease": 3},
        {"name": "GraphQL", "priority": "low", "category": "missing", "potentialScoreIncrease": 2}
      ],
      "learningRoadmap": [
        {"skill": "Cypress", "importance": "Medium", "firstStep": "Complete Cypress documentation tutorial", "potentialScoreIncrease": 3},
        {"skill": "GraphQL", "importance": "Low", "firstStep": "Build a small GraphQL API", "potentialScoreIncrease": 2}
      ],
      "summary": "Strong match for the Senior Frontend Developer position. Your React and TypeScript expertise aligns well with requirements.",
      "interviewTips": [
        "Prepare examples of TypeScript migration projects",
        "Be ready to discuss your component library experience",
        "Have metrics ready about performance optimizations"
      ],
      "adaptationHighlights": [
        {"skill": "React.js", "originalPresentation": "Used React", "adaptedPresentation": "Expert React.js developer with 6+ years experience", "improvement": "Quantified experience and emphasized expertise level"}
      ],
      "adaptationSummary": "Resume successfully tailored to emphasize frontend expertise and leadership experience."
    }'::jsonb
  );

  -- Skill map 2: Medium match (72%)
  INSERT INTO public.skill_maps (user_id, rewritten_resume_id, match_score, adaptation_score, data)
  VALUES (
    test_user_id,
    test_rewritten_id_2,
    72,
    81,
    '{
      "matchScore": 72,
      "adaptationScore": 81,
      "matchedSkills": [
        {"name": "React", "priority": "high", "category": "matched", "matchPercentage": 100},
        {"name": "Node.js", "priority": "high", "category": "matched", "matchPercentage": 90},
        {"name": "PostgreSQL", "priority": "high", "category": "matched", "matchPercentage": 85}
      ],
      "transferableSkills": [
        {"name": "AWS experience", "priority": "medium", "category": "transferable"}
      ],
      "missingSkills": [
        {"name": "Startup experience", "priority": "medium", "category": "missing"}
      ],
      "summary": "Good match for Full Stack role with strong frontend skills. Backend experience could be highlighted more.",
      "interviewTips": [
        "Emphasize end-to-end project experience",
        "Prepare to discuss database design decisions"
      ]
    }'::jsonb
  );

  -- Skill map 3: Low match (58%)
  INSERT INTO public.skill_maps (user_id, rewritten_resume_id, match_score, adaptation_score, data)
  VALUES (
    test_user_id,
    test_rewritten_id_3,
    58,
    67,
    '{
      "matchScore": 58,
      "adaptationScore": 67,
      "matchedSkills": [
        {"name": "Python", "priority": "high", "category": "matched", "matchPercentage": 75},
        {"name": "PostgreSQL", "priority": "high", "category": "matched", "matchPercentage": 80}
      ],
      "transferableSkills": [
        {"name": "API development", "priority": "high", "category": "transferable"}
      ],
      "missingSkills": [
        {"name": "Data pipeline experience", "priority": "high", "category": "missing", "potentialScoreIncrease": 10},
        {"name": "Machine learning", "priority": "medium", "category": "missing", "potentialScoreIncrease": 5}
      ],
      "learningRoadmap": [
        {"skill": "Data pipelines", "importance": "High", "firstStep": "Learn Apache Airflow basics", "potentialScoreIncrease": 10}
      ],
      "summary": "Partial match. Consider gaining more data engineering experience.",
      "interviewTips": [
        "Be honest about learning areas",
        "Highlight transferable API skills"
      ]
    }'::jsonb
  );

  -- Skill map 4: Edge case - boundary score (0), minimal data
  INSERT INTO public.skill_maps (user_id, rewritten_resume_id, match_score, adaptation_score, data)
  VALUES (
    test_user_id,
    test_rewritten_id_4,
    45,
    NULL,
    '{
      "matchScore": 45,
      "matchedSkills": [
        {"name": "C++", "priority": "high", "category": "matched", "matchPercentage": 100},
        {"name": "Rust", "priority": "high", "category": "matched", "matchPercentage": 100}
      ],
      "missingSkills": [],
      "summary": "Skills match the core requirements. Limited job description made comprehensive analysis difficult."
    }'::jsonb
  );

  RAISE NOTICE 'Created 4 test skill maps';

  -- Cover letter 1: Full, professional letter
  INSERT INTO public.cover_letters (user_id, rewritten_resume_id, content)
  VALUES (
    test_user_id,
    test_rewritten_id_1,
    'Dear Hiring Manager,

I am writing to express my strong interest in the Senior Frontend Developer position at TechCorp Inc.

With over 6 years of experience in frontend development, I have developed deep expertise in React.js, TypeScript, and modern web technologies. In my current role, I successfully led a migration from JavaScript to TypeScript that reduced bugs by 40% and implemented a design system with Tailwind CSS that is now used by 5 teams across the organization.

I am particularly excited about TechCorp''s commitment to engineering excellence and the opportunity to work on challenging problems at scale. Your requirements align perfectly with my experience:

• Expert React.js and TypeScript skills honed through years of production applications
• Extensive Next.js experience including server-side rendering optimization
• Proven track record of mentoring developers and leading technical initiatives

I would welcome the opportunity to discuss how my skills and experience can contribute to TechCorp''s continued success.

Best regards,
Ivan Ivanov'
  );

  -- Cover letter 2: Shorter, startup-focused letter
  INSERT INTO public.cover_letters (user_id, rewritten_resume_id, content)
  VALUES (
    test_user_id,
    test_rewritten_id_2,
    'Dear StartupXYZ Team,

I am excited to apply for the Full Stack Developer position at StartupXYZ.

As a developer with experience in both frontend and backend technologies, I thrive in fast-paced startup environments. My experience includes building web applications using React and Node.js, designing RESTful APIs, and working with PostgreSQL databases.

I am drawn to StartupXYZ''s mission and the opportunity to make a significant impact in a growing company. I am confident that my full-stack skills and collaborative approach would make me a valuable addition to your team.

Looking forward to discussing this opportunity.

Best,
Mark Zuckerberg'
  );

  -- Cover letter 3: Edge case - minimal content (but valid)
  INSERT INTO public.cover_letters (user_id, rewritten_resume_id, content)
  VALUES (
    test_user_id,
    test_rewritten_id_3,
    'Hello,

I am interested in the Backend Developer position. My Python and FastAPI experience match your requirements.

Regards,
Ya Batman'
  );

  RAISE NOTICE 'Created 3 test cover letters';

  RAISE NOTICE 'Test data seeding completed successfully!';
  RAISE NOTICE 'Summary: 4 job postings, 4 adapted resumes, 4 skill maps, 3 cover letters';
END $$;
