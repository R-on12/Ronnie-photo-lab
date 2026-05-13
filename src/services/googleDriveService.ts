/**
 * Google Drive picker and OAuth service
 */

const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = (import.meta as any).env.VITE_GOOGLE_API_KEY;
const APP_ID = (import.meta as any).env.VITE_GOOGLE_APP_ID;

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let tokenClient: any;
let accessToken: string | null = null;

export const initGoogleClient = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      const gapi = (window as any).gapi;
      const google = (window as any).google;

      if (!gapi || !google) {
        return reject(new Error("Google APIs not loaded"));
      }

      gapi.load("client:picker", async () => {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });
        
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: async (response: any) => {
            if (response.error !== undefined) {
              throw response;
            }
            accessToken = response.access_token;
            resolve();
          },
        });
        
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const openDrivePicker = async (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!accessToken) {
      tokenClient.callback = (response: any) => {
        if (response.error !== undefined) {
          return reject(response);
        }
        accessToken = response.access_token;
        createPicker(resolve, reject);
      };
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      createPicker(resolve, reject);
    }
  });
};

function createPicker(resolve: any, reject: any) {
  const gapi = (window as any).gapi;
  const google = (window as any).google;

  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes("image/png,image/jpeg,image/webp");

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setDeveloperKey(API_KEY)
    .setAppId(APP_ID)
    .setOAuthToken(accessToken)
    .addView(view)
    .addView(new google.picker.DocsUploadView())
    .setCallback((data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        resolve(data.docs);
      } else if (data.action === google.picker.Action.CANCEL) {
        resolve([]);
      }
    })
    .build();
  picker.setVisible(true);
}

export const downloadDriveFile = async (fileId: string): Promise<string> => {
  if (!accessToken) throw new Error("No access token");
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) throw new Error("Failed to download file from Drive");
  
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
