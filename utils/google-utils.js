import axios from "axios";

const baseUrl = "https://www.googleapis.com/drive/v3";
const badgerFolderQuery = `name = "Badger" and mimeType = 'application/vnd.google-apps.folder'`;
const BadgerDirMeta = {
  name: "Badger",
  description:
    "The file contained in this directory is for backing up / restoring your badger wallet funds. It's very important to never lose this file or you may potentially lose access to your Bitcoin Cash and tokens. No one will be able to retrieve or recover it for you if lost.",
  kind: "drive#file",
  mimeType: "application/vnd.google-apps.folder"
};
const getFile = async (accessToken, params) => {
  let queryParams = params ? constructParams(params) : params;

  try {
    const { data } = await axios.get(`${baseUrl}/files?q=${queryParams}`, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    return data.files;
  } catch (error) {
    console.log("invalid access token", error);
  }
};

const createFile = async (accessToken, data) => {
  await axios
    .post(`${baseUrl}/files`, data, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })
    .then(x => {
      console.log("x?", x.data);

      return x.data;
    });
};

const checkFolderExists = async accessToken => {
  let exists = await getFile(accessToken, badgerFolderQuery);
  return exists.length >= 1;
};

const createBadgerDir = async accessToken => {
  const exists = await checkFolderExists(accessToken);
  if (!exists) {
    createFile(accessToken, BadgerDirMeta);
  }
};

const constructParams = query => {
  return query
    ? encodeURIComponent(query)
    : encodeURIComponent("name = 'BadgerKeys.json'");
};

export { createFile, checkFolderExists, createBadgerDir, getFile };
