import { NextRequest, NextResponse } from "next/server";

const TIME_ZONE = "Asia/Amman";

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar environment variables are missing.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data?.error_description || "Failed to refresh Google access token.");
  }

  return data.access_token as string;
}

function nextDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function addOneHour(time: string) {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + 60;
  const endH = Math.floor((total % 1440) / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      appointment_date,
      appointment_time,
      client_name,
      notes,
    } = body ?? {};

    if (!title || !appointment_date) {
      return NextResponse.json(
        { error: "title and appointment_date are required." },
        { status: 400 }
      );
    }

    const accessToken = await getGoogleAccessToken();

    const description = [
      "DH Agency",
      client_name ? `Client: ${client_name}` : "",
      notes ? `Notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let event: Record<string, unknown>;

    if (appointment_time) {
      const startTime = String(appointment_time).slice(0, 5) + ":00";
      const endTime = addOneHour(String(appointment_time));

      event = {
        summary: `DH Agency — ${title}`,
        description,
        start: {
          dateTime: `${appointment_date}T${startTime}`,
          timeZone: TIME_ZONE,
        },
        end: {
          dateTime: `${appointment_date}T${endTime}`,
          timeZone: TIME_ZONE,
        },
      };
    } else {
      event = {
        summary: `DH Agency — ${title}`,
        description,
        start: { date: appointment_date },
        end: { date: nextDate(appointment_date) },
      };
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to create Google Calendar event.", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      event_id: data.id ?? null,
      event_link: data.htmlLink ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}
