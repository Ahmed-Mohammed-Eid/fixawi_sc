export default function isValidImageUrl(imageUrl) {
    try {
        const url = new URL(imageUrl);
        if(url.hostname === 'localhost') {
            console.log('localhost');
            return false;
        }

        // Check if the hostname is localhost and the port is greater than 4000
        if(url.hostname === 'localhost' && parseInt(url.port) > 4000) {
            return false;
        }

        return true;
    } catch (error) {
        // If an error occurs, it means the URL is invalid
        return false;
    }
}
