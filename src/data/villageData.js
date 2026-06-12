import { mohallas } from "./mohallas";
import { castes } from "./castes";

const generateRandomFamily = (id) => {
  const firstNamesEn = [
    "Rajesh", "Suresh", "Mahesh", "Ramesh", "Naresh", "Dinesh", "Mukesh", "Anil", "Sunil", "Manoj",
    "Amit", "Vikram", "Arjun", "Krishna", "Gopal", "Ram", "Shyam", "Mohan", "Sohan", "Rohan",
    "Priya", "Sita", "Gita", "Radha", "Meera", "Lakshmi", "Saraswati", "Parvati", "Durga", "Kali",
    "Neha", "Pooja", "Rani", "Maya", "Chhaya", "Jyoti", "Rashmi", "Shikha", "Anita", "Sunita"
  ];
  const firstNamesHi = [
    "राजेश", "सुरेश", "महेश", "रमेश", "नरेश", "दिनेश", "मुकेश", "अनिल", "सुनील", "मनोज",
    "अमित", "विक्रम", "अर्जुन", "कृष्ण", "गोपाल", "राम", "श्याम", "मोहन", "सोहन", "रोहन",
    "प्रिया", "सीता", "गीता", "राधा", "मीरा", "लक्ष्मी", "सरस्वती", "पार्वती", "दुर्गा", "काली",
    "नेहा", "पूजा", "रानी", "माया", "छाया", "ज्योति", "रश्मि", "शिखा", "अनीता", "सुनीता"
  ];
  const lastNamesEn = [
    "Sharma", "Verma", "Gupta", "Singh", "Yadav", "Jain", "Meena", "Gurjar", "Jat", "Rajput",
    "Pandey", "Tiwari", "Mishra", "Chauhan", "Solanki", "Bhati", "Rathore", "Shekhawat", "Agarwal", "Goyal"
  ];
  const lastNamesHi = [
    "शर्मा", "वर्मा", "गुप्ता", "सिंह", "यादव", "जैन", "मीणा", "गुर्जर", "जाट", "राजपूत",
    "पांडेय", "तिवारी", "मिश्रा", "चौहान", "सोलंकी", "भाटी", "राठौर", "शेखावत", "अग्रवाल", "गोयल"
  ];
  const occupations = [
    "Farmer", "Labourer", "Shopkeeper", "Teacher", "Driver", "Carpenter", "Plumber", "Electrician", "Tailor", "Government Employee"
  ];
  const houseTypes = ["Pucca", "Kutcha", "Semi-Pucca"];
  const categories = ["BPL", "APL", "Antyodaya"];
  const relations = ["Father", "Mother", "Son", "Daughter", "Wife", "Husband", "Brother", "Sister"];
  const educationLevels = ["Illiterate", "Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"];
  const maritalStatuses = ["Married", "Unmarried", "Divorced", "Widow", "Widower"];
  const genders = ["Male", "Female", "Other"];
  const banks = ["State Bank of India", "Punjab National Bank", "Bank of Baroda", "HDFC Bank", "ICICI Bank", "Axis Bank"];

  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

  const fnIdx = Math.floor(Math.random() * firstNamesEn.length);
  const lnIdx = Math.floor(Math.random() * lastNamesEn.length);
  const familyHeadEn = firstNamesEn[fnIdx] + " " + lastNamesEn[lnIdx];
  const familyHeadHi = firstNamesHi[fnIdx] + " " + lastNamesHi[lnIdx];
  const mohalla = randomItem(mohallas);
  const caste = randomItem(castes);
  const memberCount = randomNumber(2, 8);

  const members = [];
  // Add family head as first member
  members.push({
    id: `${id}-1`,
    nameEnglish: familyHeadEn,
    nameHindi: familyHeadHi,
    age: randomNumber(35, 60),
    gender: "Male",
    relation: "Head",
    aadhaarNumber: `${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)}`,
    occupation: randomItem(occupations),
    education: randomItem(educationLevels),
    maritalStatus: "Married"
  });

  // Add spouse
  const spouseFnIdx = Math.floor(Math.random() * 20) + 20;
  members.push({
    id: `${id}-2`,
    nameEnglish: firstNamesEn[spouseFnIdx] + " " + lastNamesEn[lnIdx],
    nameHindi: firstNamesHi[spouseFnIdx] + " " + lastNamesHi[lnIdx],
    age: randomNumber(30, 55),
    gender: "Female",
    relation: "Wife",
    aadhaarNumber: `${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)}`,
    occupation: randomItem(occupations),
    education: randomItem(educationLevels),
    maritalStatus: "Married"
  });

  // Add children
  for (let i = 2; i < memberCount; i++) {
    const gender = randomItem(genders);
    const childFnIdx = Math.floor(Math.random() * 20) + (gender === "Male" ? 0 : 20);
    members.push({
      id: `${id}-${i + 1}`,
      nameEnglish: firstNamesEn[childFnIdx] + " " + lastNamesEn[lnIdx],
      nameHindi: firstNamesHi[childFnIdx] + " " + lastNamesHi[lnIdx],
      age: randomNumber(1, 25),
      gender,
      relation: gender === "Male" ? "Son" : "Daughter",
      aadhaarNumber: `${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)}`,
      occupation: randomItem(occupations),
      education: randomItem(educationLevels),
      maritalStatus: randomItem(maritalStatuses)
    });
  }

  const fatherFnIdx = Math.floor(Math.random() * 20);
  return {
    id: `FAM-${String(id).padStart(4, '0')}`,
    familyHeadNameEnglish: familyHeadEn,
    familyHeadNameHindi: familyHeadHi,
    fatherNameEnglish: firstNamesEn[fatherFnIdx] + " " + lastNamesEn[lnIdx],
    fatherNameHindi: firstNamesHi[fatherFnIdx] + " " + lastNamesHi[lnIdx],
    mobile: `+91 ${randomNumber(60000, 99999)} ${randomNumber(0, 9)}${randomNumber(0, 9)}${randomNumber(0, 9)}${randomNumber(0, 9)}${randomNumber(0, 9)}`,
    alternateMobile: `+91 ${randomNumber(60000, 99999)} ${randomNumber(0, 9)}${randomNumber(0, 9)}${randomNumber(0, 9)}${randomNumber(0, 9)}${randomNumber(0, 9)}`,
    mohalla,
    caste,
    address: `${randomNumber(1, 200)}, ${mohalla}, Gram Panchayat XYZ`,
    houseNumber: `H.No. ${randomNumber(1, 500)}`,
    pinCode: `${randomNumber(300000, 399999)}`,
    aadhaarNumber: members[0].aadhaarNumber,
    janAadhaarNumber: `JAN-${randomNumber(1000000, 9999999)}`,
    rationCardNumber: `RC${randomNumber(100000, 999999)}`,
    voterId: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${randomNumber(1000000, 9999999)}`,
    bankName: randomItem(banks),
    branch: `${mohalla} Branch`,
    accountHolder: familyHeadEn,
    accountNumber: `${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)} ${randomNumber(1000, 9999)}`,
    ifsc: `${randomItem(banks).substring(0, 4).toUpperCase()}0${randomNumber(100, 999)}`,
    monthlyIncome: randomNumber(5000, 50000),
    occupation: members[0].occupation,
    category: randomItem(categories),
    houseType: randomItem(houseTypes),
    waterConnection: Math.random() > 0.3,
    electricityConnection: Math.random() > 0.2,
    toilet: Math.random() > 0.4,
    gasConnection: Math.random() > 0.5,
    familyPhoto: null,
    housePhoto: null,
    members,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
  };
};

export const initialFamilies = Array.from({ length: 60 }, (_, i) => generateRandomFamily(i + 1));
