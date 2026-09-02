export type Address = {
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
};

export type User = {
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  birthDate: { day: string; month: string; year: string };
  firstName: string;
  lastName: string;
  company: string;
  address: Address;
  mobileNumber: string;
};
