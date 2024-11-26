const disallowList =
[
    "#BLM", "#MAGA", "#resist", "abortion", "Alexandria Ocasio-Cortez", "AOC", "JD Vance", "alt-right", "anarchy",
    "Angela Merkel", "antifa", "autocracy", "ballot", "Bernie Sanders", "BLM", "blue lives",
    "Boris Johnson", "brexit", "campaign", "capitalism", "civil rights", "climate change", "collusion",
    "communism", "communist party", "congress", "conservative", "coup", "death penalty", "defund the police",
    "democrat", "democrats", "department", "dictator", "Trump", "drain the swamp", "election", "election fraud",
    "Elizabeth Warren", "Emmanuel Macron", "fascism", "FBI", "federal", "freedom of speech", "government", "governor",
    "green party", "gun control", "gun rights", "healthcare", "Hillary Clinton", "immigration", "impeachment",
    "insurrection", "IRS", "Bolsonaro", "Joe Biden", "Trudeau", "Kamala Harris", "labor party",
    "law enforcement", "left-wing", "LGBT rights", "liberal", "libertarian", "local government", "lock her up",
    "MAGA", "make america great again", "Buttigieg", "midterms", "Mitch McConnell", "Nancy Pelosi", "Narendra Modi",
    "nationalists", "neoconservatives", "neoliberals", "no justice no peace", "NSA", "parliament", "politician",
    "politics", "populism", "president", "prime minister", "progressives", "protests", "proud boys", "QAnon",
    "Recep Erdogan", "referendum", "reform", "republican", "republicans", "right-wing", "immigrants", "deport", "deportation",
    "Ron DeSantis", "sedition", "senate", "socialism", "socialist party", "Supreme Court", "taxation", "Ted Cruz",
    "Vladimir Putin", "vote", "voting", "welfare", "Ben Shapiro", "Xi Jinping"
];

export default function(songTitle: string) {
  const lowerTitle = songTitle.replace(/[^a-zA-Z\s]/g, '').toLowerCase();

  for (const word of disallowList) {
      if (lowerTitle.includes(word.toLowerCase())) {
          return word;
      }
  }

  return null;
}
