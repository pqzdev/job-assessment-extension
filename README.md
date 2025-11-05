# Job Assessment Helper - Chrome Extension

A Chrome extension that extracts job descriptions from job boards and prepares them for assessment in your Claude project.

## Features

- Extracts job details (title, company, location, description) from LinkedIn, Seek, and other job boards
- Formats with assessment prompt automatically
- Copies to clipboard ready to paste into Claude
- Works with your Claude Pro subscription (no API required)

## Installation

1. Download the extension folder to your computer
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `job-assessment-extension` folder
6. The extension icon should appear in your toolbar

## Setup

Before using, you need to update the Claude project URL:

1. Open `popup.js` in a text editor
2. Find line 107: `url: 'https://claude.ai/project/YOUR_PROJECT_ID'`
3. Replace `YOUR_PROJECT_ID` with your actual project ID from the URL when you're in this project
   - The project URL looks like: `https://claude.ai/project/abc123-def456-...`
   - Copy everything after `/project/`
4. Save the file
5. Go back to `chrome://extensions/` and click the refresh icon on the extension

## Usage

1. Navigate to any job posting (LinkedIn, Seek, etc.)
2. Click the extension icon (blue "J") in your toolbar
3. Click "Extract & Copy Job Description"
4. Click "Open Claude Project" or switch to your Claude tab manually
5. Paste into the chat
6. Claude will assess the opportunity against your background

## Assessment Criteria

The extension prompts Claude to evaluate:

1. **Match Assessment** - How well the role aligns with your skills (percentage + explanation)
2. **Key Strengths** - Which aspects of your background make you strong
3. **Potential Gaps** - Requirements you might not fully meet
4. **Compensation Estimate** - Expected salary range
5. **Application Strategy** - Whether to apply and what angle to take
6. **Red Flags** - Any concerns about the role

## Supported Job Boards

- LinkedIn (optimised)
- Seek (optimised)
- Most other job boards (generic extraction)

## Troubleshooting

**"Could not find job description"**
- Make sure you're on a job posting page (not search results)
- Try scrolling down to load the full description
- Some sites may block content extraction - try copy-pasting manually

**Extension icon not showing**
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page

**Wrong content extracted**
- The extension works best on standard job board layouts
- For unusual layouts, you may need to manually copy the relevant sections

## Privacy

- This extension runs entirely in your browser
- No data is sent to external servers
- No tracking or analytics
- Only uses clipboard for copy functionality

## Customisation

You can modify the assessment prompt in `popup.js`:
- Look for the `ASSESSMENT_PROMPT` constant (around line 27)
- Customise the questions to match your priorities
- Keep the format with clear sections for better Claude responses

## Files

- `manifest.json` - Extension configuration
- `popup.html` - User interface
- `popup.js` - Main logic and content extraction
- `icon*.png` - Extension icons
- `README.md` - This file
