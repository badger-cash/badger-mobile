import AsyncStorage from "@react-native-community/async-storage";

const getLang = async (setLang: Function) => {
  try {
    let value: any = await AsyncStorage.getItem("@lang");
    // value previously stored
    // console.log(value.toString());
    value = JSON.parse(value).name;
    setLang(value);
  } catch (e) {
    // error reading value
    console.log(e);
  }
};

const getLangCode = async (setLang: any) => {
  try {
    let value: any = await AsyncStorage.getItem("@lang");
    // value previously stored
    // console.log(value.toString());
    value = JSON.parse(value).code;
    setLang = value;
    return setLang;
  } catch (e) {
    // error reading value
    console.log(e);
  }
};

const setLang = async (value: any) => {
  try {
    value = JSON.stringify(value);
    await AsyncStorage.setItem("@lang", value);
  } catch (e) {
    // saving error
    console.log(e);
  }
};

export { getLang, getLangCode, setLang };
