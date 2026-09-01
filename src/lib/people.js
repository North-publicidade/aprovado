// Pessoas fictícias, criadas pra dar vida à função de seguir antes de existir
// login de verdade. As avaliações abaixo referenciam estabelecimentos pelo
// nome (não por id, já que os ids reais nascem no banco e mudam a cada
// importação) — quem não for encontrado na base atual é ignorado, sem erro.
// `followers`/`following` são só decorativos (efeito de rede social) — sem
// conta de usuário de verdade ainda não dá pra calcular isso de fato.
export const PEOPLE = [
  {
    id: "p1",
    name: "Marina",
    followers: 128,
    following: 84,
    ratingsByName: [
      { name: "Pizzaria Real", score: 9 },
      { name: "Over Grill", score: 10 },
      { name: "Arts Bolos", score: 9 },
    ],
  },
  {
    id: "p2",
    name: "Rafa",
    followers: 93,
    following: 61,
    ratingsByName: [
      { name: "Empório do Churrasco", score: 9 },
      { name: "Over Grill", score: 9 },
      { name: "Coffee Break", score: 8 },
    ],
  },
  {
    id: "p3",
    name: "Bia",
    followers: 215,
    following: 47,
    ratingsByName: [
      { name: "Restaurante do David", score: 8 },
      { name: "Chão Goiano", score: 9 },
      { name: "Via Sul", score: 9 },
    ],
  },
  {
    id: "p4",
    name: "João",
    followers: 56,
    following: 102,
    ratingsByName: [
      { name: "Roadhouse 153 Hamburgers", score: 9 },
      { name: "Speed Burguer", score: 8 },
      { name: "Churrascaria Catarinense", score: 8 },
    ],
  },
  {
    id: "p5",
    name: "Duda",
    followers: 174,
    following: 39,
    ratingsByName: [
      { name: "Casa Porto", score: 10 },
      { name: "Tribo do Guaraná", score: 9 },
      { name: "Pastelaria Wakkace", score: 8 },
    ],
  },
];
