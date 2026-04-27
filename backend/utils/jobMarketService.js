const ExternalJobPost = require('../models/ExternalJobPost');

const COMMON_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'php', 'c#', 'c++', 'ruby', 'go', 'golang', 'kotlin', 'swift',
  'react', 'reactjs', 'vue', 'vuejs', 'angular', 'html', 'css', 'sass', 'tailwind', 'bootstrap',
  'node', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', '.net',
  'mongodb', 'sql', 'mysql', 'postgres', 'postgresql', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'ci/cd', 'jenkins',
  'rest api', 'graphql', 'json', 'xml', 'api', 'machine learning', 'data analysis', 'data science', 'ai',
  'git', 'github', 'jira', 'figma', 'power bi', 'tableau',
  'testing', 'jest', 'cypress', 'selenium', 'mocha', 'unit test',
  'web', 'web development', 'full stack', 'mobile', 'ios', 'android', 'frontend', 'backend',
  'software', 'developer', 'engineer', 'programming', 'development', 'agile', 'scrum', 'linux', 'unix', 'windows',
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

const buildRapidApiUrl = ({ query, location, page, resultsPerPage }) => {
  const host = (process.env.RAPIDAPI_HOST || 'linkedin-job-search-api.p.rapidapi.com').trim();
  const key = (process.env.JOB_API_KEY || process.env.RAPIDAPI_KEY || '').trim();

  if (!host || !key) {
    throw new Error('RAPIDAPI_HOST and JOB_API_KEY (or RAPIDAPI_KEY) are required');
  }

  const isJSearch = host.includes('jsearch');
  const path = (process.env.RAPIDAPI_PATH || (isJSearch ? '/search' : '/active-jb-1h')).trim();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`https://${host}${normalizedPath}`);

  if (isJSearch) {
    const combinedQuery = [query, location].filter(Boolean).join(' ').trim() || 'software intern';
    url.searchParams.set('query', combinedQuery);
    url.searchParams.set('page', String(page));
    url.searchParams.set('num_pages', '1');
  } else {
    url.searchParams.set('limit', String(resultsPerPage));
    url.searchParams.set('offset', String((page - 1) * resultsPerPage));
    url.searchParams.set('description_type', 'text');
    if (query) url.searchParams.set('keyword', query);
    if (location) url.searchParams.set('location', location);
  }

  return {
    url,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': host,
    },
  };
};

const fetchAdzunaJobs = async ({ query = 'software intern', location = '', page = 1, resultsPerPage = 50 } = {}) => {
  const { url, headers } = buildRapidApiUrl({ query, location, page, resultsPerPage });
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RapidAPI request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.jobs)) return data.jobs;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

const toExternalJobDocument = (job) => {
  const title = String(pickFirst(job.title, job.job_title, job.position, job.name, 'Untitled Role'));
  const companyName = String(
    pickFirst(
      job.company?.display_name,
      job.company?.name,
      job.company_name,
      job.employer_name,
      job.company,
      'Unknown Company'
    )
  );

  const location = String(
    pickFirst(
      job.location?.display_name,
      job.location,
      [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
      [job.city, job.state, job.country].filter(Boolean).join(', '),
      ''
    )
  );

  const description = String(
    pickFirst(
      job.description,
      job.job_description,
      job.snippet,
      ''
    )
  );

  const jobUrl = String(pickFirst(job.redirect_url, job.job_apply_link, job.url, job.job_google_link, ''));

  const postedRaw = pickFirst(job.created, job.posted_at, job.job_posted_at_datetime_utc, job.pubDate);
  const postedAt = postedRaw ? new Date(postedRaw) : undefined;

  const externalJobId = String(
    pickFirst(job.id, job.job_id, job.linkedin_job_id, job.urn, jobUrl, `${title}-${companyName}-${location}`)
  );

  return {
    source: 'rapidapi',
    externalJobId,
    title,
    companyName,
    location,
    description,
    url: jobUrl,
    skills: extractSkills(`${title} ${description}`),
    salaryText: [job.salary, job.salary_min, job.salary_max, job.job_min_salary, job.job_max_salary, job.job_salary_currency]
      .filter(Boolean)
      .join(' '),
    postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : undefined,
    fetchedAt: new Date(),
    rawData: job,
  };
};

const syncAdzunaJobs = async ({ query = 'software intern', location = '', pages = 2, resultsPerPage = 50 } = {}) => {
  const pageCount = Math.max(1, Number(pages) || 1);
  const perPage = Math.max(1, Math.min(50, Number(resultsPerPage) || 50));

  const jobs = [];
  for (let page = 1; page <= pageCount; page += 1) {
    const pageResults = await fetchAdzunaJobs({ query, location, page, resultsPerPage: perPage });
    jobs.push(...pageResults);
  }

  const docs = jobs.map(toExternalJobDocument);
  let upserted = 0;

  for (const doc of docs) {
    const result = await ExternalJobPost.updateOne(
      { source: doc.source, externalJobId: doc.externalJobId },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    if (result.upsertedCount || result.modifiedCount) {
      upserted += 1;
    }
  }

  return {
    fetched: docs.length,
    upserted,
    query,
    location,
    pages: pageCount,
    resultsPerPage: perPage,
  };
};

let scheduledSyncTimer = null;

const startMarketJobSyncScheduler = () => {
  if (scheduledSyncTimer) return scheduledSyncTimer;

  const syncIntervalHours = Math.max(1, Number(process.env.MARKET_JOB_SYNC_HOURS) || 6);
  const syncIntervalMs = syncIntervalHours * 60 * 60 * 1000;

  const runSync = async () => {
    try {
      await syncAdzunaJobs({
        query: process.env.MARKET_JOB_QUERY || 'software intern',
        location: process.env.MARKET_JOB_LOCATION || '',
        pages: Number(process.env.MARKET_JOB_PAGES) || 2,
        resultsPerPage: Number(process.env.MARKET_JOB_RESULTS_PER_PAGE) || 50,
      });
      console.log('[market-sync] External job sync completed');
    } catch (err) {
      console.error('[market-sync] External job sync failed:', err.message);
    }
  };

  runSync();
  scheduledSyncTimer = setInterval(runSync, syncIntervalMs);
  return scheduledSyncTimer;
};

module.exports = {
  extractSkills,
  fetchAdzunaJobs,
  syncAdzunaJobs,
  startMarketJobSyncScheduler,
};