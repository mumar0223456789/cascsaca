import Exa from "exa-js";

export async function ExaSearch() {
  const exa = new Exa(process.env.EXA_SEARCH_API_KEY);

  const result = await exa.searchAndContents("blog post about AI", {
    type: "keyword",
    numResults: 5,
    startPublishedDate: (new Date(Date.now() - (365*24*60*60*1000))).toISOString(),
    endPublishedDate: (new Date()).toISOString(),
    text: {
      maxCharacters: 20000,
    },
  });

  return result
}