import { Octokit } from "@octokit/rest";
import { OpenAIApi, Configuration } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_SECRET,
  })
);

const main = async () => {
  const owner = process.env.OWNER;
  const repo = process.env.REPO;
  const pull_number = process.env.PR_NUMBER;

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });

  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number,
  });

  // Read PR title and description
  const prTitle = pr.title;
  const prDescription = pr.body;
  const listOfCommits = commits.reduce(
    (text, item) => `${text} \n ${item.commit.message}`,
    ``
  );

  const prompt = `Prepare release notes from following PR Info. \n\n PR Title: ${prTitle} \n\n PR Description: ${prDescription} \n\n Commits: \n ${listOfCommits}`;

  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  console.log(result);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
