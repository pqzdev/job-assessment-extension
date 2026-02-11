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

const ASSESSMENT_PROMPT = `Assess this job opportunity:

**ASSESSMENT:**
- Match Score: X% - brief explanation
- Decision: APPLY / MAYBE / SKIP - why
- Key Strengths: 3-5 relevant qualifications I have
- Gaps: Any deal-breakers or concerns
- Salary Expectation: Range based on role/location

**IF APPLY: Offer to create:**
- Tailored CV (2 pages max, nothing fabricated)
- Cover letter (1 page max)
- Contact details for CV: {{CONTACT_DETAILS}}

Wait for confirmation before creating documents. When creating, write naturally - no AI fluff, quantify achievements, authentic tone.

---

**JOB POSTING:**

`;

// Shared function to extract and copy job description
async function extractAndCopy(button, originalButtonText) {
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

    // Get contact details from storage
    const { userEmail, userPhone } = await chrome.storage.local.get(['userEmail', 'userPhone']);

    // Build contact details string
    let contactDetails = '';
    if (userEmail || userPhone) {
      const details = [];
      if (userEmail) details.push(`Email: ${userEmail}`);
      if (userPhone) details.push(`Phone: ${userPhone}`);
      contactDetails = details.join(' | ');
    } else {
      contactDetails = '(Contact details from your CV knowledge)';
    }

    // Format the complete text to copy
    let textToCopy = ASSESSMENT_PROMPT.replace('{{CONTACT_DETAILS}}', contactDetails);

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
    status.textContent = `✓ Copied! ${Math.round(jobData.description.length / 1000)}k characters ready to paste.`;

    button.textContent = originalButtonText;
    button.disabled = false;

    return true;
  } catch (error) {
    status.className = 'status error';
    status.textContent = `Error: ${error.message}`;
    button.textContent = originalButtonText;
    button.disabled = false;
    return false;
  }
}

// Button 1: Copy & Open Claude Project
document.getElementById('extractAndOpenBtn').addEventListener('click', async () => {
  const button = document.getElementById('extractAndOpenBtn');
  const originalText = button.textContent;

  // Check if project ID is saved
  const { claudeProjectId } = await chrome.storage.local.get('claudeProjectId');

  if (!claudeProjectId) {
    const status = document.getElementById('status');
    status.className = 'status error';
    status.textContent = 'Please save your Claude Project ID in the settings below first.';
    return;
  }

  // Extract and copy
  const success = await extractAndCopy(button, originalText);

  // Open Claude project if extraction succeeded
  if (success) {
    chrome.tabs.create({
      url: `https://claude.ai/project/${claudeProjectId}`
    });
  }
});

// Button 2: Copy Job Description Only
document.getElementById('extractBtn').addEventListener('click', async () => {
  const button = document.getElementById('extractBtn');
  const originalText = button.textContent;
  await extractAndCopy(button, originalText);
});

// Load saved settings on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const { claudeProjectId, userEmail, userPhone } = await chrome.storage.local.get(['claudeProjectId', 'userEmail', 'userPhone']);

  if (claudeProjectId) {
    document.getElementById('projectIdInput').value = claudeProjectId;
  }
  if (userEmail) {
    document.getElementById('emailInput').value = userEmail;
  }
  if (userPhone) {
    document.getElementById('phoneInput').value = userPhone;
  }
});

// Save project ID, email, and phone
document.getElementById('saveBtn').addEventListener('click', async () => {
  const projectId = document.getElementById('projectIdInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const status = document.getElementById('status');

  if (!projectId) {
    status.className = 'status error';
    status.textContent = 'Please enter a Project ID.';
    return;
  }

  await chrome.storage.local.set({
    claudeProjectId: projectId,
    userEmail: email,
    userPhone: phone
  });

  status.className = 'status success';
  status.textContent = '✓ Settings saved!';

  setTimeout(() => {
    status.textContent = '';
  }, 3000);
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
