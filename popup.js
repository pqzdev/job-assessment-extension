// Job board selectors for extracting job descriptions
const JOB_SELECTORS = {
  linkedin: {
    title: '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title',
    company: '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name',
    location: '.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet',
    description: '.jobs-description-content__text, .jobs-description, .jobs-box__html-content'
  },
  seek: {
    title: 'h1[data-automation="job-detail-title"]',
    company: 'span[data-automation="advertiser-name"]',
    location: 'span[data-automation="job-detail-location"]',
    description: 'div[data-automation="jobAdDetails"]'
  },
  generic: {
    // Fallback selectors for other job boards
    title: 'h1, [class*="job-title"], [class*="jobTitle"]',
    company: '[class*="company"], [class*="employer"]',
    description: '[class*="description"], [class*="job-detail"], main, article'
  }
};

const ASSESSMENT_PROMPT = `I found this job opportunity. Please assess it against my background and experience:

1. **Match Assessment**: How well does this role align with my skills, experience, and career goals? (Give a percentage match and brief explanation)

2. **Key Strengths**: Which aspects of my background make me a strong candidate?

3. **Potential Gaps**: What requirements might I not fully meet? Are these deal-breakers or manageable gaps?

4. **Compensation Estimate**: Based on the role and my experience, what salary range should I expect/target?

5. **Application Strategy**: Should I apply? If yes, what angle should I take in my cover letter and CV tailoring?

6. **Red Flags**: Any concerns about the role, company, or job description?

---

**JOB POSTING:**

`;

document.getElementById('extractBtn').addEventListener('click', async () => {
  const button = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  
  button.disabled = true;
  button.textContent = 'Extracting...';
  status.innerHTML = '';
  
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute content script to extract job details
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobDescription,
      args: [JOB_SELECTORS]
    });
    
    const jobData = results[0].result;
    
    if (!jobData.description || jobData.description.length < 50) {
      throw new Error('Could not find job description on this page');
    }
    
    // Format the complete text to copy
    let textToCopy = ASSESSMENT_PROMPT;
    
    if (jobData.title) {
      textToCopy += `**Title:** ${jobData.title}\n`;
    }
    if (jobData.company) {
      textToCopy += `**Company:** ${jobData.company}\n`;
    }
    if (jobData.location) {
      textToCopy += `**Location:** ${jobData.location}\n`;
    }
    if (jobData.url) {
      textToCopy += `**URL:** ${jobData.url}\n`;
    }
    
    textToCopy += `\n---\n\n${jobData.description}`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(textToCopy);
    
    status.className = 'status success';
    status.textContent = `✓ Copied! ${Math.round(jobData.description.length / 1000)}k characters ready to paste into Claude.`;
    
    button.textContent = 'Extract & Copy Job Description';
    button.disabled = false;
    
  } catch (error) {
    status.className = 'status error';
    status.textContent = `Error: ${error.message}`;
    button.textContent = 'Extract & Copy Job Description';
    button.disabled = false;
  }
});

document.getElementById('openClaudeBtn').addEventListener('click', () => {
  // Update this URL to your actual Claude project URL
  chrome.tabs.create({ 
    url: 'https://claude.ai/project/YOUR_PROJECT_ID'
  });
});

// This function runs in the context of the web page
function extractJobDescription(selectors) {
  function getTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }
  
  function getAllTextContent(selector) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements)
      .map(el => el.textContent.trim())
      .filter(text => text.length > 0)
      .join('\n\n');
  }
  
  // Detect which job board we're on
  const hostname = window.location.hostname;
  let selectorSet = selectors.generic;
  
  if (hostname.includes('linkedin.com')) {
    selectorSet = selectors.linkedin;
  } else if (hostname.includes('seek.com')) {
    selectorSet = selectors.seek;
  }
  
  // Extract job details
  const title = getTextContent(selectorSet.title);
  const company = getTextContent(selectorSet.company);
  const location = getTextContent(selectorSet.location);
  const description = getAllTextContent(selectorSet.description);
  
  // If generic selectors didn't work well, try to get main content
  let finalDescription = description;
  if (description.length < 200) {
    const main = document.querySelector('main, article, [role="main"]');
    if (main) {
      finalDescription = main.textContent.trim();
    }
  }
  
  return {
    title,
    company,
    location,
    description: finalDescription,
    url: window.location.href
  };
}
