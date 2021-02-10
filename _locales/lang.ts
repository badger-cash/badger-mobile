import AsyncStorage from "@react-native-community/async-storage";

const storeData = async (value: string) => {
  try {
    await AsyncStorage.setItem("@lang", value);
  } catch (e) {
    // saving error
  }
};

// const getData = async (): Promise<Array<Employee> | string> => {
//     try {
//         const value = await AsyncStorage.getItem('@lang')
//         // value previously stored
//         return value
//     } catch (e) {
//         // error reading value
//     }
// }

async function getData() {
  var value = await AsyncStorage.getItem("@lang");
  return value;
}

export default getData;
