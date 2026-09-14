import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("google_oauth_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.json(
      { error: "Invalid Google OAuth request." },
      { status: 400 }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Google environment variables are missing." },
      { status: 500 }
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: "Failed to connect Google Calendar.", details: tokens },
      { status: 400 }
    );
  }

  const refreshToken = tokens.refresh_token;

  if (!refreshToken) {
    return new NextResponse(
      "Google connected, but no refresh token was returned. Reconnect with consent.",
      { status: 400 }
    );
  }

  const response = new NextResponse(
    `<!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Google Calendar Connected</title>
      </head>
      <body style="background:#07111f;color:white;font-family:Arial;padding:30px;text-align:center">
        <h1>تم ربط Google Calendar ✅</h1>
        <p>انسخ الرمز التالي وضعه في Vercel باسم GOOGLE_REFRESH_TOKEN.</p>
        <p><strong>لا ترسل هذا الرمز لأي شخص.</strong></p>
        <textarea readonly style="width:90%;height:150px;padding:12px">${refreshToken}</textarea>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );

  response.cookies.delete("google_oauth_state");

  return response;
}
