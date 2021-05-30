import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tailwind from "tailwind-rn";
import { Avatar } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ShopProps } from "../../types/data-types";
import { DatabaseContext } from "../../contexts/DatabaseContext";
import { db, storage } from "../../lib/firebase";
import { Picker } from "@react-native-picker/picker";
import { CITIES } from "../../constants";

const CProfile: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, data: oldData } = useContext(DatabaseContext);
  const data = oldData as ShopProps;
  const [fullName, setFullName] = useState(data.fullName);
  const [shopName, setShopName] = useState(data.shopName);
  const [city, setCity] = useState(data.city);
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber);
  const [image, setImage] = useState<string | undefined>("");
  const [same, setSame] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleChange = () => {
    let t = 0;
    if (fullName === data.fullName) t++;
    if (phoneNumber === data.phoneNumber) t++;
    if (shopName === data.shopName) t++;
    if (city === data.city) t++;
    if (image) {
      setSame(false);
      return;
    }
    setSame(t === 4);
  };

  useEffect(() => {
    handleChange();
  }, [fullName, phoneNumber, shopName, city, image]);

  const pickImage = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      const { uri } = await resizePhoto(result.uri, [224, 224]);
      setImage(uri);
    }
  };

  const resizePhoto = async (uri: string, size: [number, number]) => {
    const actions = [{ resize: { width: size[0], height: size[1] } }];
    const saveOptions = {
      base64: true,
      format: ImageManipulator.SaveFormat.JPEG,
    };
    return await ImageManipulator.manipulateAsync(uri, actions, saveOptions);
  };

  const update = async () => {
    if (user) {
      setLoading(() => true);
      await db.collection("users").doc(user.uid).update({
        city,
        shopName: shopName.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (image) {
        const _image =
          Platform.OS === "ios" ? image.replace("file://", "") : image;

        const blob: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function () {
            reject(new TypeError("Network request failed"));
          };
          xhr.responseType = "blob";
          xhr.open("GET", _image, true);
          xhr.send(null);
        });

        const ref = storage.ref(`users/${user?.uid}/profile_picture.jpg`);
        const snapshot = ref.put(blob);
        const snap = await snapshot;
        const url = await snap.ref.getDownloadURL();

        await db.collection("users").doc(user?.uid).update({
          photoURL: url,
        });

        setLoading(() => false);
        navigation.popToTop();
      } else {
        setLoading(() => false);
        navigation.popToTop();
      }
    }
  };

  return (
    <ScrollView style={tailwind("flex flex-1")}>
      <KeyboardAvoidingView style={tailwind("m-4")}>
        <View style={tailwind("flex items-center justify-center")}>
          <Avatar
            size="xlarge"
            containerStyle={tailwind("bg-gray-300")}
            rounded
            source={
              image || data.photoURL
                ? { uri: image ? image : data.photoURL }
                : undefined
            }
            icon={{ type: "feather", name: "image" }}
          >
            <Avatar.Accessory size={30} onPress={pickImage} />
          </Avatar>
        </View>

        <Text style={tailwind("mt-4 text-xs text-gray-600")}>Shop Name</Text>
        <TextInput
          editable={!loading}
          value={shopName}
          onChangeText={setShopName}
          style={tailwind(
            "mt-1 rounded border border-gray-300 px-2 bg-white h-10"
          )}
        />

        <Text style={tailwind("mt-2 text-xs text-gray-600")}>City</Text>
        <View
          style={tailwind(
            "mt-1 justify-center rounded border border-gray-300 px-2 bg-white h-10"
          )}
        >
          <Picker
            itemStyle={{ fontSize: 14 }}
            selectedValue={city}
            onValueChange={(val) => setCity(val)}
          >
            {CITIES.map((city) => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>
        </View>

        <Text style={tailwind("mt-2 text-xs text-gray-600")}>Full Name</Text>
        <TextInput
          editable={!loading}
          value={fullName}
          onChangeText={setFullName}
          style={tailwind(
            "mt-1 rounded border border-gray-300 px-2 bg-white h-10"
          )}
        />

        <Text style={tailwind("mt-2 text-xs text-gray-600")}>Phone Number</Text>
        <TextInput
          editable={!loading}
          value={phoneNumber}
          keyboardType="number-pad"
          maxLength={13}
          onChangeText={(e) => {
            if (e.length < 3) setPhoneNumber("+63");
            else setPhoneNumber(e);
          }}
          style={tailwind(
            "mt-1 rounded border border-gray-300 px-2 bg-white h-10"
          )}
        />

        <Text style={tailwind("mt-2 text-xs text-gray-600")}>
          Email Address
        </Text>
        <View
          style={tailwind(
            "flex mt-1 justify-center rounded border border-gray-300 px-2 bg-gray-200 h-10"
          )}
        >
          <Text>{data.email}</Text>
        </View>

        <TouchableOpacity
          onPress={update}
          activeOpacity={0.7}
          disabled={same || loading}
          style={tailwind(
            `mt-6 flex flex-row p-2 rounded items-center justify-center ${
              same ? "bg-gray-400 opacity-70" : "bg-blue-500"
            }`
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={tailwind("text-white")}>Update</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default CProfile;
