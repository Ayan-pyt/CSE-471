const fs = require('fs');
const { AffindaAPI, AffindaCredential } = require('@affinda/affinda');

let client = null;

const normalizeSkill = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const uniqueSkills = (skills = []) => {
  const seen = new Set();
  const result = [];

  (skills || []).forEach((skill) => {
    const normalized = normalizeSkill(skill);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(skill.toString().trim());
  });

  return result;
};

const getAffindaClient = () => {
  if (!process.env.AFFINDA_API_KEY) {
    throw new Error('AFFINDA_API_KEY is required for candidate NLP scoring');
  }

  if (!client) {
    client = new AffindaAPI(new AffindaCredential(process.env.AFFINDA_API_KEY));
  }

  return client;
};

const extractSkillsFromResult = (result) => {
  const rawSkills = result?.data?.skills || result?.skills || [];

  return uniqueSkills(rawSkills.map((item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.name || item.parsed || item.skill || '';
  }).filter(Boolean));
};

const analyzeCvFile = async (filePath) => {
  const affindaClient = getAffindaClient();
  const fileStream = fs.createReadStream(filePath);

  const options = { file: fileStream };
  if (process.env.AFFINDA_WORKSPACE_ID) {
    options.workspace = process.env.AFFINDA_WORKSPACE_ID;
  }

  const result = await affindaClient.createDocument(options);
  const extractedSkills = extractSkillsFromResult(result);

  return {
    provider: 'affinda',
    extractedSkills,
    analyzedAt: new Date(),
  };
};

const calculateNlpRecommendationBonus = ({ requiredSkills = [], cvInsights = {} } = {}) => {
  const required = uniqueSkills((requiredSkills || []).map((entry) => entry?.skill).filter(Boolean));
  const nlpPool = new Set(uniqueSkills(cvInsights.extractedSkills || []));

  if (required.length === 0 || nlpPool.size === 0) {
    return {
      bonus: 0,
      matchedSkills: [],
      coverage: 0,
    };
  }

  const matchedSkills = required.filter((skill) => nlpPool.has(normalizeSkill(skill)));
  const coverage = matchedSkills.length / required.length;

  return {
    bonus: Number(Math.min(10, coverage * 10).toFixed(2)),
    matchedSkills,
    coverage: Number(coverage.toFixed(4)),
  };
};

module.exports = {
  analyzeCvFile,
  calculateNlpRecommendationBonus,
};