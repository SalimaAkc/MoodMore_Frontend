// ===================================================================
// API CLIENT - Communication with backend
// ===================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ===================================================================
// RESPONSE HANDLING
// ===================================================================

// read and validate server response
async function readAnswer(response) {
  let data = null

  try {
    data = await response.json()
  } catch (error) {
    throw new Error('The server gave an answer we could not read. Try again later.')
  }

  if (data && data.error) {
    throw new Error(data.error)
  }

  if (!response.ok) {
    throw new Error('The server could not handle that request. Try again later.')
  }

  return data
}

// ===================================================================
// PUBLIC API - Request methods
// ===================================================================

// GET request
export async function getFromApi(path, params = {}) {
  const query = new URLSearchParams()

  for (const key in params) {
    if (params[key]) {
      query.set(key, params[key])
    }
  }

  let url = API_URL + path
  const queryString = query.toString()

  if (queryString) {
    url = url + '?' + queryString
  }

  let response

  try {
    response = await fetch(url)
  } catch (error) {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  return readAnswer(response)
}

// POST request (with authentication)
export async function postToApi(path, token, body = {}) {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(API_URL + path, options)
  } catch (error) {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  return readAnswer(response)
}

// DELETE request (with authentication)
export async function deleteFromApi(path, token, body) {
  const options = {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  }

  if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(API_URL + path, options)
  } catch (error) {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  return readAnswer(response)
}
