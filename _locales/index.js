const langs = require("./index.json");
const en = require("./en/messages.json");
const ar = require("./ar/messages.json");
const AsyncStorage = require("@react-native-community/async-storage");

const storeData = async value => {
  try {
    await AsyncStorage.setItem("@lang", value);
  } catch (e) {
    // saving error
  }
};

const getData = async () => {
  try {
    const value = await AsyncStorage.getItem("@lang");
    if (value !== null) {
      // value previously stored
    }
  } catch (e) {
    // error reading value
  }
};

// const fs = require("react-native-fs")
class lang {
  constructor(setLang = "en", screen) {
    this.lang = getData;
    this.screen = screen;
  }

  chageLang(lang) {
    storeData(lang);
    // this.lang = lang
  }

  getDBlang() {
    switch (this.lang) {
      case "en":
        return en;
        break;
      case "ar":
        return ar;
        break;
      default:
        break;
    }
  }

  getStr(str) {
    data = this.getDBlang();
    return data["pages"][this.screen][str].toString();
  }
}

export default lang;
