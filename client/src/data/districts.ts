import { IN_STATES } from '@/lib/constants'

type DistrictMap = Record<string, string[]>

const DISTRICTS: DistrictMap = {
  'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa', 'Other'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Papum Pare', 'Lower Subansiri', 'Upper Subansiri', 'West Siang', 'East Siang', 'Other'],
  Assam: ['Kamrup', 'Kamrup Metropolitan', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Sonitpur', 'Cachar', 'Barpeta', 'Tinsukia', 'Other'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Nalanda', 'Rohtas', 'Other'],
  Chhattisgarh: ['Raipur', 'Bilaspur', 'Durg', 'Raigarh', 'Korba', 'Bastar', 'Other'],
  Goa: ['North Goa', 'South Goa', 'Other'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Kutch', 'Gandhinagar', 'Other'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Karnal', 'Hisar', 'Rohtak', 'Other'],
  'Himachal Pradesh': ['Shimla', 'Kangra', 'Mandi', 'Solan', 'Una', 'Hamirpur', 'Other'],
  Jharkhand: ['Ranchi', 'East Singhbhum', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Giridih', 'Other'],
  Karnataka: ['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Mangaluru', 'Hubballi-Dharwad', 'Kalaburagi', 'Other'],
  Kerala: ['Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Kollam', 'Malappuram', 'Other'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Other'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Kolhapur', 'Other'],
  Manipur: ['Imphal West', 'Imphal East', 'Thoubal', 'Bishnupur', 'Other'],
  Meghalaya: ['East Khasi Hills', 'West Khasi Hills', 'Jaintia Hills', 'Ri Bhoi', 'Other'],
  Mizoram: ['Aizawl', 'Lunglei', 'Champhai', 'Other'],
  Nagaland: ['Kohima', 'Dimapur', 'Mokokchung', 'Other'],
  Odisha: ['Khordha', 'Cuttack', 'Ganjam', 'Sambalpur', 'Balasore', 'Puri', 'Other'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Other'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar', 'Other'],
  Sikkim: ['East Sikkim', 'West Sikkim', 'South Sikkim', 'North Sikkim', 'Other'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Other'],
  Telangana: ['Hyderabad', 'Ranga Reddy', 'Medchal–Malkajgiri', 'Warangal', 'Nizamabad', 'Karimnagar', 'Other'],
  Tripura: ['West Tripura', 'Gomati', 'Dhalai', 'Other'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar', 'Almora', 'Other'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur Nagar', 'Varanasi', 'Prayagraj', 'Agra', 'Ghaziabad', 'Gorakhpur', 'Other'],
  'West Bengal': ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Darjeeling', 'Murshidabad', 'Other'],

  Delhi: ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi', 'Other'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Pulwama', 'Other'],
  Ladakh: ['Leh', 'Kargil', 'Other'],
  Chandigarh: ['Chandigarh', 'Other'],
  Puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Other'],
  Lakshadweep: ['Kavaratti', 'Other'],
  'Andaman and Nicobar Islands': ['South Andaman', 'North and Middle Andaman', 'Nicobar', 'Other'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Dadra and Nagar Haveli', 'Other'],
}

export function getDistrictsForState(state: string) {
  return DISTRICTS[state] || ['Other']
}

export function ensureAllStatesPresent() {
  for (const s of IN_STATES) {
    if (!DISTRICTS[s]) DISTRICTS[s] = ['Other']
  }
  return DISTRICTS
}

