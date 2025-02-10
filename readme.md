# Localify

A modern web application for managing and streaming your local music library.

Localify allows you to index your music library and stream it to your browser. You can create playlists, like music and curate your own music library.

It also include nice UI/UX for searching and browsing your music library.

![Localify](./assets/localify.png)

The software is super lightweight and can run on your local machine or hosted in a docker container somewhere. Supports users and authentication.

# Running the Docker Image

You can get the docker image from [Github Container Registry](https://github.com/ShoarW/Localify/pkgs/container/localify)

Pull the image:
```bash
docker pull ghcr.io/shoarw/localify:latest
```

Run the image and mount your music library and storage.

You'll only need to mount the storage if you want to persist your data.

Music library is required - there is no default music library or upload feature.

```bash
docker run -d -p 3000:3000 -v /path/to/your/music:/media -v /path/to/your/storage:/storage ghcr.io/shoarw/localify:latest
```

The application will be available at http://localhost:3000

## Project Structure

- `localify-client/`: React-based frontend application
- `localify-server/`: Hono-based backend server

## Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Docker and Docker Compose (for containerized deployment)

## Local Development

### Setting up the Environment

1. Clone the repository:
```bash
git clone https://github.com/ShoarW/Localify.git
cd localify
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file
- Generate a secure `JWT_SECRET`

### Running the Server

1. Navigate to the server directory:
```bash
cd localify-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The server will be available at http://localhost:3000

### Running the Client

1. In a new terminal, navigate to the client directory:
```bash
cd localify-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The client will be available at http://localhost:5173

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Running with Docker Compose

1. Copy the example environment file if you haven't already:
```bash
cp .env.example .env
```

2. Update the `.env` file:
- Generate a secure `JWT_SECRET`

3. Build and start the containers:
```bash
docker-compose up --build
```

The application will be available at http://localhost:4500

### Environment Variables

#### Server Configuration
- `JWT_SECRET`: Secret key for JWT tokens


#### Client Configuration
- `VITE_API_URL`: Backend API URL


## License

You may use this project for personal use.
