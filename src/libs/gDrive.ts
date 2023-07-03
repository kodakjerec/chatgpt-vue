import { storeGoogleDrive, storeSettings } from "@/store/index";
import { googleSdkLoaded } from "vue3-google-login";
import { createToaster } from "@meforma/vue-toaster";

/**
 * get a new token
 */
export async function accessToken() {
  googleSdkLoaded((google) => {
    google.accounts.oauth2
      .initTokenClient({
        client_id: "929956701294-bvbtd8uh85cnb8gbf1fi5sboa9ue1f5r.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: async (response) => {
          storeSettings().setGDriveToken(response.access_token);
          createToaster().success("Login success. Checking Cloud Data.", { position: "top" });

          // signed.restore or backup
          await storeGoogleDrive().cloundToLocalStorage();
          createToaster().success("The webpage will be refreshed in 2 seconds.", { position: "top" });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
      })
      .requestAccessToken();
  });
}

export async function gDriveCheck(fileName: string) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?trashed=false&q=trashed=false and fullText contains "' +
        fileName +
        '"',
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + storeSettings().getGDriveToken,
        },
      }
    );
    const { body, status } = response;
    if (body) {
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        const decodedText = decoder.decode(value, { stream: true });
        const json = JSON.parse(decodedText); // start with "data: "
        if (status !== 200) {
          const content = json.error.message ?? decodedText;
          clearToken(status);
          return false;
        } else {
          if (json.files.length > 0) {
            return json.files[0].id;
          }
          return false;
        }
      }
    }
  } catch (e: any) {
    console.log(e);
    return false;
  }
}
export async function gDrivePatch(contentString: string, fileName: string, fileId: string) {
  const file = new Blob([contentString], { type: "text/plain" });

  try {
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files/" + fileId, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + storeSettings().getGDriveToken,
      },
      body: file,
    });
    const { body, status } = response;
    if (body) {
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        const decodedText = decoder.decode(value, { stream: true });
        if (status !== 200) {
          const json = JSON.parse(decodedText); // start with "data: "
          const content = json.error.message ?? decodedText;
          clearToken(status);
          return false;
        } else {
          return true;
        }
      }
    }
  } catch (e: any) {
    console.log(e);
    return false;
  }
}
export async function gDriveSave(contentString: string, fileName: string) {
  let metadata = {
    name: fileName,
    mimeType: "text/plain",
    parents: ["root"],
  };
  const form = new FormData();
  const file = new Blob([contentString], { type: "text/plain" });
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  try {
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + storeSettings().getGDriveToken,
      },
      body: form,
    });
    const { body, status } = response;
    if (body) {
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        const decodedText = decoder.decode(value, { stream: true });
        if (status !== 200) {
          const json = JSON.parse(decodedText); // start with "data: "
          const content = json.error.message ?? decodedText;
          clearToken(status);
          return false;
        } else {
          return true;
        }
      }
    }
  } catch (e: any) {
    console.log(e);
    return false;
  }
}
export async function gDriveLoad(fileId: string) {
  try {
    const response = await fetch("https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + storeSettings().getGDriveToken,
      },
    });
    const { body, status } = response;
    if (body) {
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        const decodedText = decoder.decode(value, { stream: true });
        if (status !== 200) {
          const json = JSON.parse(decodedText); // start with "data: "
          const content = json.error.message ?? decodedText;
          clearToken(status);
          return false;
        } else {
          return decodedText;
        }
      }
    }
  } catch (e: any) {
    console.log(e);
    return false;
  }
}
/**
 * clean localStorage token
 * @param status
 */
function clearToken(status) {
  if (status === 401) {
    // clean token
    storeSettings().setGDriveToken("");
    // refresh
    this.accessToken();
  }
}
