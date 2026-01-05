import { google } from "googleapis";

export const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const getOAuth2Client = (clientId: string, clientSecret: string) => {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${process.env.NEXTAUTH_URL}/api/auth/google`
  );
};

export const getAuthUrl = (clientId: string, clientSecret: string) => {
  const oauth2Client = getOAuth2Client(clientId, clientSecret);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
};
