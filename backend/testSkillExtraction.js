require('dotenv').config();
const mongoose = require('mongoose');

const COMMON_SKILLS = [
  'javascript', 'typescript', 'react', 'node', 'node.js', 'express', 'mongodb',
  'sql', 'mysql', 'postgres', 'python', 'django', 'flask', 'java', 'spring',
  'c#', '.net', 'php', 'laravel', 'go', 'golang', 'kotlin', 'swift', 'android',
  'ios', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'rest api', 'graphql',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'git', 'linux', 'machine learning',
  'data analysis', 'data science', 'power bi', 'tableau', 'figma', 'testing',
  'jest', 'cypress', 'selenium', 'devops', 'ci/cd', 'agile', 'scrum',
];

const normalizeText = (value = '') => value
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9+#./-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractSkills = (text = '') => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const skills = new Set();
  for (const skill of COMMON_SKILLS) {
    const normalizedSkill = normalizeText(skill);
    if (!normalizedSkill) continue;

    const escaped = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`);
    if (pattern.test(normalized)) {
      skills.add(skill === 'reactjs' ? 'react' : skill);
    }
  }

  return Array.from(skills);
};

const testText = 'Software Developer Apprentice About Chemistry Marketing web devel IT Jobs full_time permanent';

console.log('=== TESTING SKILL EXTRACTION ===');
console.log('Original text:', testText);
console.log('Normalized text:', normalizeText(testText));
console.log('Extracted skills:', extractSkills(testText));
console.log('');

// Now check what's in the database
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const ExternalJobPost = require('./models/ExternalJobPost');
  const jobs = await ExternalJobPost.find().limit(3).lean();
  
  console.log('=== DATABASE JOBS ===');
  jobs.forEach((job, idx) => {
    console.log(`Job ${idx + 1}:`);
    console.log(`  Title: ${job.title}`);
    console.log(`  Description preview: ${job.description?.substring(0, 100)}...`);
    console.log(`  Skills extracted: ${job.skills?.length || 0} - ${JSON.stringify(job.skills)}`);
    
    // Try extracting from job title
    const titleSkills = extractSkills(job.title);
    console.log(`  Skills from title only: ${JSON.stringify(titleSkills)}`);
    console.log('');
  });
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
