const petPromise = await fetch("https://verceldeploy02.vercel.app/db.json");
const pets = await petPromise.json();

const template = document.querySelector("#language-card");
const wrapper = document.createElement("div");

pets.forEach((pet) => {
  const clone = template.content.cloneNode(true);
  clone.querySelector("h3").textContent = pet.name;

  const img = clone.querySelector("img");
  img.src = pet.photo;
  img.alt = `A ${pet.species} named ${pet.name}`;

  wrapper.appendChild(clone);
});

document.querySelector(".languages").appendChild(wrapper);
