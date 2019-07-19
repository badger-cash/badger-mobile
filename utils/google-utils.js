const uploadUrl = "https://www.googleapis.com/upload/drive/v3";
const baseUrl = "https://www.googleapis.com/drive/v3";
const badgerFolderQuery = `name = "Badger" and mimeType = 'application/vnd.google-apps.folder'`;
const badgerKeysQuery = `name = "BadgerKeys.json" and mimeType = 'application/json'`;
const badgerDirMeta = {
  name: "Badger",
  description:
    "The file contained in this directory is for backing up / restoring your badger wallet funds. It's very important to never lose this file or you may potentially lose access to your Bitcoin Cash and tokens. No one will be able to retrieve or recover it for you if lost.",
  kind: "drive#file",
  mimeType: "application/vnd.google-apps.folder"
};

const boundaryString = "badgerString"; // can be anything

const backupBadgerKeys = async (accessToken, fileContents) => {
  try {
    const badgerDir = await getBadgerFolderId(accessToken);
    const folderExists = !!badgerDir;

    const badgerKeys = await getFile(accessToken, badgerKeysQuery);
    const fileExists = badgerKeys.length >= 1;

    if (!folderExists) {
      await createBadgerDir(accessToken);
    }

    if (!fileExists) {
      await createFile(accessToken, fileContents);
    } else {
      await createFile(accessToken, fileContents, badgerKeys[0].id);
    }
  } catch (error) {
    console.log(error);

    throw new Error("error backing up", error);
  }
};

const getFile = async (accessToken, params = "", fileID = "") => {
  let queryParams = constructParams(params);

  try {
    let response = await fetch(`${baseUrl}/files/${fileID}?q=${queryParams}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const { files } = await response.json();

    return files;
  } catch (error) {
    throw new Error("error getting file", error);
  }
};

const createBadgerDir = async accessToken => {
  try {
    let response = await fetch(`${baseUrl}/files/`, {
      method: "POST",
      body: JSON.stringify(badgerDirMeta),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    let data = await response.json();

    return data;
  } catch (error) {
    throw new Error("error in createBadgerDir", error);
  }
};

const createFile = async (accessToken, fileContents, existingFileId) => {
  // https://developers.google.com/drive/api/v3/reference/files/create

  const folderID = await getBadgerFolderId(accessToken);

  const body = createMultipartBody(fileContents, folderID, !!existingFileId);
  const options = configurePostOptions(
    body.length,
    accessToken,
    !!existingFileId
  );

  try {
    let response = await fetch(
      `${uploadUrl}/files${
        existingFileId ? `/${existingFileId}` : ""
      }?uploadType=multipart`,
      {
        ...options,
        body
      }
    );
    let data = await response.json();

    return data;
  } catch (error) {
    console.log("error ", error);

    throw new Error("error creating file", error);
  }
};
const createMultipartBody = (body, folderID, fileExists = false) => {
  // https://developers.google.com/drive/v3/web/multipart-upload

  const badgerKeysMetaData = {
    name: "BadgerKeys.json",
    description:
      "Your secret keys for your Badger Wallet. Do not share with anyone.",
    mimeType: "application/json",
    parents: fileExists ? "" : [folderID]
  };

  const multipartBody = `\r\n--${boundaryString}\r\nContent-Type: application/json; charset=UTF-8\r\n\n${JSON.stringify(
    badgerKeysMetaData
  )}\r\n--${boundaryString}\r\nContent-Type: application/json\r\n\r\n\n${JSON.stringify(
    body
  )}\r\n--${boundaryString}--`;

  return multipartBody;
};

const configurePostOptions = (bodyLength, accessToken, fileExists = false) => {
  return {
    method: fileExists ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundaryString}`,
      "Content-Length": bodyLength
    }
  };
};

const getBadgerFolderId = async accessToken => {
  const folder = await getFile(accessToken, badgerFolderQuery);

  if (folder === undefined || folder.length < 1) {
    return false;
  }

  return folder[0].id;
};

const constructParams = query => {
  if (query) {
    return encodeURIComponent(query);
  }
  return encodeURIComponent("name = 'BadgerKeys.json'");
};

export { backupBadgerKeys };
