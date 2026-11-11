# StudySpace Nutrition AI Worker

This optional backend keeps the model binding and access secret out of the public GitHub Pages code.

## Setup (Cloudflare Workers Free)

1. Create a Cloudflare account with the account holder's required age/guardian permission.
2. Open Workers & Pages and create a Worker named `studyspace-nutrition-ai`.
3. Deploy the contents of `nutrition-ai-worker.js` as the Worker code.
4. Add the Workers AI binding named `AI` in the Worker settings (or deploy with the included `wrangler.toml`).
5. In Worker Settings > Variables and Secrets, add a secret named `ACCESS_TOKEN`. Use a long, unique value. Never commit it to GitHub or put it in the Worker source.
6. Deploy the Worker and copy its `https://…workers.dev` address.
7. In StudySpace > Ernährung > Ernährungsprofil, enter the Worker URL and the same access code, then save the profile.
8. Open Ernährung > KI-Assistent. With no endpoint configured, the local recipe/pantry search remains available.

## Notes

- The Worker accepts requests only from `https://faulixx11.github.io`.
- The shared access code is stored in this browser's nutrition profile (localStorage). Anyone with access to this browser profile can inspect it; use a dedicated token and do not reuse passwords.
- Model: `@cf/zai-org/glm-4.7-flash`.
- Cloudflare Workers AI currently includes 10,000 Neurons/day in its Free allocation. Limits and availability can change; check Cloudflare's current pricing before deployment.
- The Worker is optional. No AI request is made until an endpoint is configured and a message is sent.
- This assistant is educational, not medical advice.
