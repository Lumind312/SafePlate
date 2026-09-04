import { useEffect, useState } from "react";
import "./App.css";

const FALLBACK_ALLERGENS = [
  "peanut",
  "tree nut",
  "milk",
  "egg",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "sesame",
];

function App() {
  const [recipe, setRecipe] = useState("");

  const [allergens, setAllergens] = useState(
    FALLBACK_ALLERGENS
  );

  const [selectedAllergens, setSelectedAllergens] =
    useState([
      "peanut",
      "tree nut",
      "milk",
      "egg",
      "soy",
      "wheat",
      "fish",
      "shellfish",
      "sesame",
    ]);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ---------------------------------------------
  // Load allergens from backend
  // ---------------------------------------------

  useEffect(() => {
    fetch("http://localhost:5000/api/allergens")
      .then((response) => response.json())
      .then((data) => {
        if (data.allergens?.length) {
          setAllergens(data.allergens);
          setSelectedAllergens(data.allergens);
        }
      })
      .catch(() => {
        // Use fallback allergens if backend isn't ready
      });
  }, []);

  // ---------------------------------------------
  // Toggle allergy
  // ---------------------------------------------

  function toggleAllergen(allergen) {
    setSelectedAllergens((current) => {
      if (current.includes(allergen)) {
        return current.filter(
          (item) => item !== allergen
        );
      }

      return [...current, allergen];
    });
  }

  // ---------------------------------------------
  // Analyze recipe
  // ---------------------------------------------

  async function analyzeRecipe() {
    if (!recipe.trim()) {
      setError("Please enter a recipe first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipe,
            allergens: selectedAllergens,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to analyze recipe."
        );
      }

      setResult(data);

    } catch (err) {
      setError(
        err.message ||
        "Could not connect to the analyzer."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------
  // Reset
  // ---------------------------------------------

  function reset() {
    setRecipe("");
    setResult(null);
    setError("");
  }

  const detectedAllergens =
    result?.allergens || {};

  const detectedCount =
    Object.keys(detectedAllergens).length;

  return (
    <div className="app">

      {/* Navigation */}
      <nav className="navbar">

        <div className="brand">
          <div className="brand-icon">🥗</div>

          <div>
            <h1>SafePlate</h1>
            <span>AI Allergy Analyzer</span>
          </div>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          AI Analyzer
        </div>

      </nav>


      {/* Main */}
      <main className="container">

        {/* Hero */}
        <section className="hero">

          <div className="hero-text">

            <div className="eyebrow">
              AI-POWERED FOOD SAFETY
            </div>

            <h2>
              Know what's in your food
              <span> before you eat it.</span>
            </h2>

            <p>
              Paste a recipe, select your allergies,
              and let our AI identify ingredients
              that could trigger an allergic reaction.
            </p>

          </div>

        </section>


        {/* Allergy Selection */}
        <section className="card">

          <div className="section-header">

            <div>
              <h3>1. Select your allergies</h3>

              <p>
                We'll check the recipe against
                the allergies you select.
              </p>
            </div>

            <span className="selection-count">
              {selectedAllergens.length} selected
            </span>

          </div>


          <div className="allergy-grid">

            {allergens.map((allergen) => {

              const selected =
                selectedAllergens.includes(allergen);

              return (
                <button
                  key={allergen}
                  className={`allergy ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() =>
                    toggleAllergen(allergen)
                  }
                >
                  <span className="check">
                    {selected ? "✓" : ""}
                  </span>

                  {formatAllergen(allergen)}
                </button>
              );
            })}

          </div>

        </section>


        {/* Recipe Input */}
        <section className="card">

          <div className="section-header">

            <div>
              <h3>2. Enter your recipe</h3>

              <p>
                Paste the ingredients or full recipe
                below.
              </p>
            </div>

          </div>


          <textarea
            value={recipe}
            onChange={(event) =>
              setRecipe(event.target.value)
            }
            placeholder={`Example:

2 cups all-purpose flour
1 cup whole milk
2 large eggs
4 tablespoons butter
1 teaspoon vanilla extract
1/2 cup sugar`}
          />


          {error && (
            <div className="error">
              ⚠️ {error}
            </div>
          )}


          <div className="input-actions">

            <button
              className="clear-button"
              onClick={reset}
            >
              Clear
            </button>

            <button
              className="analyze-button"
              onClick={analyzeRecipe}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "🔍 Analyze Recipe"}
            </button>

          </div>

        </section>


        {/* Results */}
        {result && (

          <section className="results">

            <div className="results-header">

              <div>
                <div className="eyebrow">
                  ANALYSIS COMPLETE
                </div>

                <h2>Recipe analysis</h2>
              </div>

              {detectedCount === 0 ? (
                <div className="safe-badge">
                  ✓ No selected allergens detected
                </div>
              ) : (
                <div className="danger-badge">
                  ⚠ {detectedCount} potential allergen
                  {detectedCount !== 1 ? "s" : ""} found
                </div>
              )}

            </div>


            {/* Warning */}
            {detectedCount > 0 && (

              <div className="warning">

                <div className="warning-icon">
                  ⚠️
                </div>

                <div>

                  <h3>
                    Potential allergens detected
                  </h3>

                  <p>
                    The analyzer found ingredients
                    associated with your selected
                    allergy profile. Review them
                    carefully before consuming.
                  </p>

                </div>

              </div>

            )}


            {/* Allergen cards */}
            {detectedCount > 0 && (

              <div className="allergen-results">

                {Object.entries(
                  detectedAllergens
                ).map(
                  ([allergen, ingredients]) => (

                    <div
                      className="allergen-card"
                      key={allergen}
                    >

                      <div className="allergen-title">

                        <span>⚠️</span>

                        <strong>
                          {formatAllergen(allergen)}
                        </strong>

                      </div>

                      <div className="ingredient-list">

                        {ingredients.map(
                          (ingredient, index) => (

                            <span
                              className="ingredient-tag"
                              key={`${ingredient}-${index}`}
                            >
                              {ingredient}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}


            {/* Detected ingredients */}
            <div className="ingredients-section">

              <h3>
                Detected ingredients
              </h3>

              <p>
                Ingredients identified by the
                recipe AI model.
              </p>

              <div className="ingredient-table">

                {result.ingredients.map(
                  (ingredient, index) => {

                    const isAllergen =
                      Object.values(
                        detectedAllergens
                      )
                        .flat()
                        .some(
                          (item) =>
                            item === ingredient.text
                        );

                    return (
                      <div
                        className={`ingredient-row ${
                          isAllergen
                            ? "flagged"
                            : ""
                        }`}
                        key={`${ingredient.text}-${index}`}
                      >

                        <span>
                          {isAllergen
                            ? "⚠️"
                            : "✓"}
                        </span>

                        <strong>
                          {ingredient.text}
                        </strong>

                        <span className="confidence">
                          {Math.round(
                            ingredient.confidence * 100
                          )}
                          % confidence
                        </span>

                      </div>
                    );
                  }
                )}

              </div>

            </div>


            {/* Alternative placeholder */}
            {detectedCount > 0 && (

              <div className="alternative-card">

                <div className="alternative-icon">
                  💡
                </div>

                <div>

                  <h3>
                    Safer alternatives
                  </h3>

                  <p>
                    AI-powered ingredient
                    substitutions can be generated
                    for the flagged ingredients.
                  </p>

                  <button className="alternative-button">
                    Suggest Alternatives
                  </button>

                </div>

              </div>

            )}

          </section>

        )}


        {/* Disclaimer */}
        <footer>

          <strong>
            ⚕️ Safety note
          </strong>

          <p>
            This tool is designed to help identify
            potential allergens and is not a substitute
            for medical advice or careful ingredient
            verification. Always check product labels
            and consult a qualified healthcare
            professional regarding food allergies.
          </p>

        </footer>

      </main>

    </div>
  );
}


// ---------------------------------------------
// Helpers
// ---------------------------------------------

function formatAllergen(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default App;
