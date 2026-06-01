// /js/stats.js

export const stats = {

  pushkaTasks: [],
  gabaiRequests: [],
  pushkaRequests: [],
  donations: [],
  kvitlech: [],
  users: [],
  roles: [],
  accessRequests: [],

};

export function isLoaded(key) {
  return stats[key] && stats[key].length > 0;
}

export function setData(key, data) {
  stats[key] = data;
}

export function getData(key) {
  return stats[key];
}

export function clearData(key) {
  stats[key] = [];
}