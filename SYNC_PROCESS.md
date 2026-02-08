# Social Media Sync - 2-Step Process Implementation

## Overview
Both X (Twitter) and Instagram adapters now use a precise 2-step process to fetch ONLY customer feedback on the user's own content, not the user's activity on other accounts.

---

## X (Twitter) Adapter

### Process Flow:

**STEP A: Discovery - Get User's Own Posts**
- Query: `site:x.com/{username}/status`
- Fetches up to 20 posts from the user's timeline (last 30 days)
- Extracts post IDs from URLs

**STEP B: Collection - Fetch Replies to Each Post**
- For each post ID, searches: `"{postId}" "Replying to @{username}"`
- Filters out the user's own replies (URLs containing `/{username}/status`)
- Collects ONLY other users' replies to that specific post
- 500ms delay between requests to avoid rate limiting

### Example Output:
```
[2-STEP PROCESS for @JohnDeere]
[STEP A] Fetching JohnDeere's own posts...
  Found 6 posts by JohnDeere

[STEP B] Fetching replies to these posts...
  [1/6] Post ID: 2016964567935369592
    Found 3 potential replies
    Skipping JohnDeere's own reply
    ✅ Added reply from @user123
    ✅ Added reply from @user456

[RESULT] Total replies collected: 12
[RESULT] After date filter: 12 items
```

---

## Instagram Adapter

### Process Flow:

**STEP 1: DISCOVERY - Find All Posts**
- Uses `apify/instagram-scraper` (more robust than profile-scraper)
- Fetches list of posts for the username
- Filters by date (last 30 days)

**STEP 2: COLLECTION - Scrape Comments**
- For each post found, extracts comments using `apify/instagram-comment-scraper`
- Parses comment text and author information
- Segregates comments on the post

**STEP 3: CLEANSE - Filter User's Own Comments**
- Removes any comment where `author_username` matches `{username}`
- Ensures we only analyze customer feedback, not the user's responses

**STEP 4: STORAGE - Save to Database**
- All cleansed comments saved to `ReviewItem` table
- Linked to the project via `projectId`

### Example Output:
```
[InstagramAdapter] Step 1: Getting posts BY @letsblinkit via apify/instagram-scraper
  Scraper found 50 raw posts
  Identified 12 recent posts by @letsblinkit (since 2024-01-01)

[InstagramAdapter] Step 2: Fetching comments ON those 12 posts (apify/instagram-comment-scraper)
  Returning 16 comments (replies ON @letsblinkit's posts, excluding own)
```

---

## Testing

To test the sync:
1. Go to `http://localhost:3000`
2. Open a project with X or Instagram source
3. Click "Sync Now"
4. Check terminal logs for detailed process output

Or use the debug page:
1. Go to `http://localhost:3000/debug-sync`
2. Enter project ID
3. Click "Test Sync"
4. Review terminal output
