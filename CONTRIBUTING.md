# Contributing Guide, Cohort 3

## Submission steps

1. Fork this repo to your personal GitHub account.
2. Create a branch named `week-{N}-{your-github-handle}`, e.g. `week-1-scotch`.
3. Build that week's deliverable on the branch, don't touch `main`.
4. **Test it yourself and confirm it actually works** before you do anything else.
5. Take a screenshot of your working test, a real terminal run, not a code editor view.
6. Open a pull request from your branch to your fork's `main` branch.
   - PR title format: `[Cohort 3 · Week N] Your Name, Deliverable title`.
   - Fill in the PR template completely: what you built, what works, what
     doesn't, and your public URL or Fuji deployment link if relevant.
     Reference copy: [`docs/PULL_REQUEST_TEMPLATE.md`](docs/PULL_REQUEST_TEMPLATE.md).
7. Take a screenshot of the PR you just opened.
8. Post on X: a detailed post with both screenshots (working test + PR),
   tagging **@code_mwangi** and **@AvaxAfrica**. See the template below.
9. Copy the link to your X post.
10. Submit that link on the quest page (link going up in the WhatsApp community
    once it's live, hold onto your link until then).

Share both your PR link and your X post link in the WhatsApp community.
The X post is in addition to the PR link, not instead of it.

## X post template

Don't just post a link, say what you actually built. Something like:

> Just shipped my Week 1 agent for @AvaxAfrica's Mini Hack Cohort 3 🛠️
>
> Built a CLI agent with [Claude / GPT / Gemini] that [one line on what it
> does, e.g. "answers Avalanche questions using web search + the Avalanche
> MCP server, with full conversation memory"].
>
> [screenshot: working test]
> [screenshot: the PR]
>
> Cohort 3 · Building Agentic Solutions on Avalanche
> cc @code_mwangi
>
> [link to your PR]

Swap in your own details, what tools you used, what was hardest, what
you'd build next. A post that actually says something gets more engagement
than a bare link, and it's a better record of your own progress too.

## Code style

- Use `async/await`, not `.then()` chains.
- Every tool call and API call gets a `try/catch`.
- No API keys in code, `.env` only, and `.env` is git-ignored.
- Comment the *why*, not the *what*, the code should already say what it does.
- If you switch model providers in `chat.js`, update your PR description to
  say which one you used, the grading rubric doesn't care which model, but
  reviewers need to know what they're testing.

## Getting unblocked

Post in the WhatsApp community first. Tag the Technical Lead only if
you've been stuck for more than 30 minutes.
