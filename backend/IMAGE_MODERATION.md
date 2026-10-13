# Image moderation

New profile avatars and event cover uploads are staged as
`ImageModeration` records. Celery runs English OCR with Tesseract and sends the
image plus extracted text to OpenAI's `omni-moderation-latest` endpoint.

## Outcomes

- Low risk: apply the image to the profile/event and let the event become active
  once all other moderation checks are clear.
- Uncertain: keep the current avatar/event image in place and add the staged
  image to **Admin → User → Image moderations**. Admins can approve or reject
  it there; rejecting it applies one strike.
- High confidence: reject the uploaded image, leave the old image in place,
  and apply one strike. A clean event can still become active without the new
  cover image.
- Provider/OCR failure: keep the image unpublished and retry the Celery task
  up to five times. A failed request remains visible in the admin queue and can
  be retried there. Provider failures never add a strike.

## Configuration

Set `OPENAI_API_KEY` in both the web and Celery worker environments. Never
commit the key or send it in chat.

Unreviewed uploads must live in a **separate private S3-compatible bucket**.
Set `MODERATION_S3_BUCKET_NAME` to that bucket's name in both environments.
The application uses the existing `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`,
`AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` credentials. Do not use the
public media bucket: images waiting for moderation must not have public URLs.
Local `DEBUG=True` uses the configured default storage.

Install the Tesseract OCR executable in each runtime environment and make it
available on `PATH`. On Windows, install Tesseract OCR and restart the terminal
used to run Django/Celery. On Render, install `tesseract-ocr` in the build
environment, for example by prefixing the existing build command with
`apt-get update && apt-get install -y tesseract-ocr &&`. Python's `pytesseract`
dependency alone does not install the OCR executable. If it is not on `PATH`,
set `TESSERACT_CMD` to its full path.

Optional thresholds (scores from 0 to 1):

- `IMAGE_MODERATION_REJECT_THRESHOLD` defaults to `0.90` for high-confidence
  sexual, graphic violence, threatening hate, and threatening harassment.
- `IMAGE_MODERATION_REVIEW_THRESHOLD` defaults to `0.20`; any category score
  at or above it goes to admin review.

Thresholds are initial policy defaults and should be tuned after reviewing a
representative, consented sample. OpenAI can change its moderation model, so
recheck them periodically.

## Scope and limitations

The image pipeline currently moderates English text extracted by OCR and visual
sexual, violence/gore, and self-harm categories. OpenAI documents hate,
harassment, and sexual/minors as text-only categories; OCR lets the text
classifier inspect words found in images. OCR can miss stylized, small, or
obscured text.

This MVP does **not** detect child sexual abuse material (CSAM). OpenAI says not
to send known or suspected CSAM to its Moderation API, and the endpoint does not
support the sexual/minors category for images. Do not treat this integration as
a child-safety detector or as coverage for that category. Suspected illegal
content requires a separate policy and handling process.

## Testing

Automated tests mock both OCR and the OpenAI HTTP response, so they need no API
key, no network access, and no harmful image samples. A manual smoke test can
use a few benign and policy-approved images; verify the safe, review, rejection,
and retry paths in Admin → User → Image moderations.

For manual frontend + backend testing in Docker, see
`infra/docker/README-test.md`. That stack includes PostgreSQL, Redis, the
Tesseract-enabled backend/worker image, and local filesystem media storage.
