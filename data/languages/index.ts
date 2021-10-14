import AsyncStorage from "@react-native-community/async-storage";
import * as Storage from "./store";
import RNRestart from "react-native-restart";

function get_lang(callback: Function) {
  let op;
  let data = Storage.get("@lang");
  // console.log("data : ", data);
  data
    .then(lang => {
      if (data) {
        op = lang;
      } else {
        op = null;
      }

      callback(op);
    })
    .done();
}

const getLang = async (setLang: Function) => {
  try {
    let value: any = await AsyncStorage.getItem("@lang");
    // value previously stored
    // console.log(value);
    if (value == null) {
      setLang("English");
    } else {
      value = JSON.parse(value);
      setLang(value.name);
    }
  } catch (e) {
    // error reading value
    console.log(e);
  }
};

const setLang = async (value: any) => {
  try {
    value = JSON.stringify(value);
    await Storage.store("@lang", value);
    RNRestart.Restart();
  } catch (e) {
    // saving error
    console.log(e);
  }
};

export { getLang, setLang, get_lang };
