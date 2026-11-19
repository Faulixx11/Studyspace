# CUTLINE — AI Video Editor

A browser-based video editor that turns plain-language editing instructions into a real MP4 render.

## What works

- Upload a local video in the browser and preview it before editing.
- Send natural-language instructions such as “make a fast vertical short, remove pauses, keep the strongest points, add bold subtitles”.
- With an OpenAI API key: transcribe the audio, ask the model for source-time edit decisions, map the retained sections to a new timeline, generate captions, and render the result.
- Render a real MP4 with FFmpeg: jump cuts, portrait/landscape/square reframing, style-specific colour treatment, loudness normalization, title card and burned-in subtitles.
- Preview and download the exported result.
- Without an API key: a clearly labelled fallback render keeps the full video and applies the selected visual format/style. It does not pretend to be AI editing.

## Run locally

Requirements: Node.js 20 or newer and an OpenAI API key for AI-assisted editing.

1. Copy \`.env.example\` to \`.env\`.
2. Put your key in \`OPENAI_API_KEY\` in \`.env\`. Never put the key in browser JavaScript or commit your real \`.env\` file.
3. In this folder run \`npm install\`.
4. Run \`npm start\`.
5. Open \`http://localhost:3000\`.

The first AI edit uses audio transcription and a language model, so API usage may incur charges. Check your API account's current pricing and set an appropriate usage limit before testing.

## Deploy

The included \`render.yaml\` can be used as a starting point for a Node web service. Add \`OPENAI_API_KEY\` and optionally \`OPENAI_CHAT_MODEL\` as secret environment variables in the hosting provider.

This starter stores uploads and outputs on the server filesystem. Many free hosting plans use ephemeral storage and impose request/runtime limits. For a public production service, add private object storage, user accounts, quotas, job persistence, deletion controls, virus scanning, stronger rate limiting, and a queue/worker setup before accepting other people's videos.

## Important limitations

This is a working MVP, not a finished professional post-production suite. AI edit decisions depend on the transcript; it cannot reliably understand every visual joke, action, camera movement, or speaker position. The current portrait crop is centre-based (not face tracking), edits are hard cuts (not AI-generated footage), and there is no automatic music licensing, multi-camera sync, collaborative timeline, or guaranteed studio-grade result. Always review an edit before publishing it.

Only upload videos you own or have permission to edit. Get permission from people featured in footage and avoid uploading private or sensitive recordings without their consent.
