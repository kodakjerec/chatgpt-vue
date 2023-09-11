import { load, save } from "@/libs/gCloudStore";
import { createToaster } from "@meforma/vue-toaster";
import Swal from "sweetalert2";
import { storageGet, storageSet, storeSettings } from ".";
let saveKeys = ["lastPath", "logData", "settings", "apiKey", "prompts"];

/**
 * 上傳本地資料到雲端
 * @returns
 */
export async function localStorageToCloud() {
  // 準備資料
  let filterData = {};
  saveKeys.map((key) => {
    filterData[key] = storageGet(key);
  });

  const saveData = JSON.stringify(filterData);

  // 開始上傳
  let isOverwrite = true;
  const userInfo: any = await storeSettings().getGDriveToken;

  if (userInfo) {
    // 下載遠端檔案
    const cloudData: any = await load(userInfo["sub"]);
    const isSync = storeSettings().isSync;

    if (cloudData && cloudData.data && !isSync) {
      // TODO 檢查檔案日期
      const lastModifiedTime: any = cloudData.data.modifiedTime;

      // TODO 詢問使用者是否覆蓋
      if (lastModifiedTime) {
        const result = await Swal.fire({
          title: "local->cloud: " + new Date(lastModifiedTime).toISOString().replace("T", " ").replace("Z", " "),
          showCancelButton: true,
          confirmButtonText: "Yes",
        });
        if (!result.isConfirmed) {
          isOverwrite = false;
        }
      }
      storeSettings().setIsSync(true);
    }
  }

  // 上傳覆蓋
  if (userInfo && isOverwrite) {
    const userId = userInfo["sub"];
    const eMail = userInfo["email"];
    if (userId && eMail && saveData) {
      const patchResult = await save(userId, eMail, saveData);
      if (patchResult) {
        return patchResult;
      }
    }
  }

  return "";
}
/**
 * 下載雲端資料覆蓋本地
 */
export async function cloundToLocalStorage() {
  const userInfo: any = await storeSettings().getGDriveToken;

  if (userInfo) {
    let isOverwrite = true;

    const cloudData: any = await load(userInfo["sub"]);
    const isSync = storeSettings().isSync;
    if (cloudData && cloudData.data && !isSync) {
      // TODO 檢查檔案日期
      const lastModifiedTime: any = cloudData.data.modifiedTime;

      // TODO 詢問使用者是否覆蓋
      if (lastModifiedTime) {
        const result = await Swal.fire({
          title: "cloud -> local:" + new Date(lastModifiedTime).toISOString().replace("T", " ").replace("Z", " "),
          showCancelButton: true,
          confirmButtonText: "是",
        });
        if (!result.isConfirmed) {
          isOverwrite = false;
        }
      }
      storeSettings().setIsSync(true);
    }

    // 下載
    if (isOverwrite && cloudData.data) {
      const fromData = JSON.parse(cloudData.data.data);

      if (fromData) {
        const notMapAttr = ["googleOAuth2token"];
        Object.entries(fromData).map(([key, value]) => {
          if (!notMapAttr.includes(key)) {
            storageSet(key, value);
          }
        });
      }
    }
  }
}
