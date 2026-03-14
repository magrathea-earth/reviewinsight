import { Polar } from "@polar-sh/sdk";

const apiKey = process.env.POLAR_ACCESS_TOKEN;

export const polar = new Polar({
  accessToken: apiKey ?? "",
});
