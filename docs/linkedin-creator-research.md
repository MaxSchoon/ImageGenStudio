# LinkedIn Creator Studio Research

Last checked: 2026-06-02.

## Production Presets

| Workflow | Target | Dimensions | Notes |
| --- | --- | --- | --- |
| Personal profile banner | LinkedIn cover image | 1584 x 396 | JPG/PNG, under 8MB. Design around the profile photo overlap and responsive crop. Critical copy should live in the right half, especially top-right and right-center. |
| Feed landscape image | Single image post or sponsored-content style visual | 1200 x 628 | 1.91:1. Strong default for link-style or campaign visuals. |
| Feed square image | Single image post | 1200 x 1200 | 1:1. Durable cross-device creator format. |
| Feed vertical image | Single image post | 720 x 900 | 4:5. Mobile-first; avoid edge text. |
| PDF storybook page | LinkedIn document post | 1080 x 1350 | Use one consistent page size, then export as a flattened PDF. Recommended story length for this app: 5 pages. |

## LinkedIn Banner Safe Area

LinkedIn's official cover image spec is 1584 x 396, JPG or PNG, under 8MB. The cover sits behind the profile photo, and the profile-photo position changes across desktop, mobile, and profile contexts. The app should therefore treat the lower-left and center-left as profile-photo risk zones, not as message zones.

Implementation guidance:

- Generate on a 4:1 final canvas.
- Put brand marks, text, and CTAs in the right half.
- Keep the lower-left visually calm.
- Use the profile-photo risk zone as texture, background, or negative space.
- Avoid tiny text because LinkedIn compression and mobile scaling make it fail fast.

## Feed Image Guidance

LinkedIn's official single-image ad specs are a good hard production baseline for post images because they are feed-rendered on desktop and mobile:

- Landscape: 1.91:1, recommended 1200 x 628, minimum 640 x 360.
- Square: 1:1, recommended 1200 x 1200, minimum 360 x 360.
- Vertical: 4:5, recommended 720 x 900, minimum 360 x 640.
- File types include JPG, PNG, and GIF for those ad specs; use PNG for crisp text/graphics and JPG for photo-heavy assets.

For organic creator posts, prefer:

- 1200 x 628 for article/link-style visuals and campaign announcements.
- 1200 x 1200 for reusable creator cards.
- 720 x 900 for mobile-first posts where vertical space helps the hook.

## PDF Storybook Workflow

LinkedIn document posts support PDF/PPT/DOC formats, up to 100MB and 300 pages. LinkedIn recommends converting to PDF where possible, flattening or merging multi-layer PDFs, avoiding video/animation, adding a document title, using secure hyperlinks, and keeping every page the same size.

This app should default to a 5-page sales and marketing structure:

1. Hook: one sharp claim or tension the audience recognizes.
2. Problem: show the hidden cost, friction, or missed opportunity.
3. Insight: explain the counterintuitive idea or new mental model.
4. Proof: show example, data, process, or before/after.
5. CTA: invite a specific next step tied to the offer.

Each page should be readable on mobile, use one idea per page, and keep the text large enough that the slide still works in LinkedIn's carousel preview.

## Sources

- LinkedIn Help: Add or change the cover image on your profile - https://www.linkedin.com/help/linkedin/answer/a568217/adding-or-changing-the-background-photo-on-your-profile?lang=en
- LinkedIn Help: Photo will not upload to your profile - https://www.linkedin.com/help/linkedin/answer/a549049/photo-won-t-upload-to-your-profile?lang=en
- LinkedIn Help: Single image ads advertising specifications - https://www.linkedin.com/help/linkedin/answer/a426534
- LinkedIn Help: Upload and share documents on LinkedIn - https://www.linkedin.com/help/linkedin/answer/a518909/upload-and-share-documents-on-linkedin?lang=en
