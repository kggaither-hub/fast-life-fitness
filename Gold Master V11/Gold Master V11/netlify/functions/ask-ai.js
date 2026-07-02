exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const question = body.question || body.prompt || body.message || "";

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ answer: "No question received." }),
      };
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are the Fast Life Fitness AI Coach. Give direct, helpful answers about food, fasting, weight loss, restaurants, products, and goals.",
          },
          { role: "user", content: question },
        ],
      }),
    });

    const data = await r.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      "AI did not return an answer.";

    return {
      statusCode: 200,
      body: JSON.stringify({ answer }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ answer: "Ask AI error: " + err.message }),
    };
  }
};
