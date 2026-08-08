// Block page shell. Placeholder for now — ticket #6 makes it beautiful (fixed
// headline + rotating focus line). It reads the blocked host that buildRules
// passes as the `blocked` query parameter and shows which site was intercepted.

const blocked = new URLSearchParams(location.search).get("blocked");
if (blocked) {
  const domain = document.getElementById("domain");
  if (domain) {
    domain.textContent = `Blocked: ${blocked}`;
    domain.hidden = false;
  }
}
