# Skribbl Game Client

This is the client-side code for the Skribbl Game Clone. It is built using modern web technologies to provide a smooth and interactive user experience.

## Features
- **Responsive Design**: Works seamlessly across different screen sizes.
- **Interactive Gameplay**: Real-time drawing and guessing.
- **Customizable Avatars**: Players can choose and customize their avatars.
- **Lobby System**: Create or join game rooms.

## Tech Stack
- **React**: For building the user interface.
- **Vite**: For fast development and build processes.
- **CSS**: For styling the components.

## Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- Node.js (v16 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Skribbl-Game-Clone.git
   ```
2. Navigate to the client directory:
   ```bash
   cd Skribbl-Game-Clone/client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
Start the development server to preview the client:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Building for Production
To create an optimized production build:
```bash
npm run build
```
The build files will be generated in the `dist` folder.

### Previewing the Production Build
To preview the production build locally:
```bash
npm run preview
```

## Project Structure
```
client/
├── public/          # Static assets
├── src/             # Source code
│   ├── components/  # Reusable components
│   ├── context/     # Context providers
│   ├── pages/       # Page components
│   ├── App.jsx      # Main app component
│   └── main.jsx     # Entry point
├── index.html       # HTML template
├── vite.config.js   # Vite configuration
└── package.json     # Project metadata and scripts
```

## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

Happy coding!