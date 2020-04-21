import React, { useEffect, useState } from "react";

import api from "services/api";

import "./styles.css";

function App() {
  const [repositories, setRepositories] = useState([]);

  useEffect(() => {
    api.get("repositories").then((response) => {
      setRepositories(response.data);
    });
  }, []);

  async function handleAddRepository() {
    api
      .post("repositories", {
        id: "f7c20546-b862-4520-aa3e-5576140f9f52",
        url: "https://github.com/marcosdourado",
        title: "Desafio Bootcamp",
        techs: ["React", "Node.js", "React Native"],
      })
      .then((response) => setRepositories([...repositories, response.data]));
  }

  async function handleRemoveRepository(id) {
    const repositoryIndex = repositories.findIndex(
      (repository) => repository.id === id
    );

    if (repositoryIndex >= 0) {
      api.delete(`repositories/${id}`).then(() => {
        repositories.splice(repositoryIndex, 1);

        setRepositories([...repositories]);
      });
    }
  }

  return (
    <div>
      <ul data-testid="repository-list">
        {repositories.map((repository) => (
          <li key={repository.id}>
            {repository.title}
            <button onClick={() => handleRemoveRepository(repository.id)}>
              Remover
            </button>
          </li>
        ))}
      </ul>

      <button onClick={handleAddRepository}>Adicionar</button>
    </div>
  );
}

export default App;
