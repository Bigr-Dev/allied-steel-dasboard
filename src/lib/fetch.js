import Cookies from 'js-cookie'

export async function fetchData(url, method, data = null) {
  // Retrieve the access token from cookies if any
  const token = Cookies.get('access_token') // Directly use Cookies.get() instead of await
  // console.log('url :>> ', url)
  // console.log('method :>> ', method)
  // console.log('data :>> ', data)
  // Set up the options for the fetch request
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '', // Correct Authorization header
    },
    body: data ? JSON.stringify(data) : null,
  }

  try {
    // Perform the fetch request
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/${url}`,
      options
    )

    // If the URL is 'login', handle the special case and store tokens
    if (url === 'login' && response.ok) {
      const responseData = await response.json()

      // Return the response after storing the tokens
      return responseData
    }

    // If not a login request, check if the response is okay
    if (!response.ok) {
      const errorData = await response?.json() // Get the error details from the response
      throw new Error(
        `Error: ${response.statusText} - ${
          errorData?.message || 'Unknown error'
        }`
      )
    }

    // Return the parsed response body for other requests
    return response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    throw new Error('Failed to fetch data. Please try again later.')
  }
}
