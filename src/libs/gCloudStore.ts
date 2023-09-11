import { createToaster } from "@meforma/vue-toaster";

async function solveReadableStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;

    const decodedText = JSON.parse(decoder.decode(value, { stream: true }));
    return decodedText;
  }
}

export async function load(sub: string) {
  try {
    const response = await fetch("https://asia-east1-bodyfatrecorder.cloudfunctions.net/load?id=" + sub, {
      method: "GET",
    });
    const { body, status, headers } = response;

    if (status === 200) {
      return solveReadableStream(body ?? new ReadableStream());
    } else {
      createToaster().error(headers["msg"], { position: "top" });
      return "";
    }
  } catch (e: any) {
    console.log(e);
    createToaster().error("Failed to check data list", { position: "top" });
    return "";
  }
}

export async function save(sub: string, eMail: string, fileContent: string) {
  try {
    let formData = new FormData();
    formData.append("id", sub);
    formData.append("eMail", eMail);
    formData.append("data", fileContent);
    const response = await fetch("https://asia-east1-bodyfatrecorder.cloudfunctions.net/save", {
      method: "POST",
      body: formData,
    });
    const { body, status, headers } = response;
    if (status === 200) {
      return "";
    } else {
      createToaster().error(headers["msg"], { position: "top" });
      return headers["msg"];
    }
  } catch (e: any) {
    console.log(e);
    createToaster().error("Failed to check data list", { position: "top" });
    return "error";
  }
}
