import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { MovieReviewProgramAnchor } from "../target/types/movie_review_program_anchor";

describe("anchor-movie-review-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MovieReviewProgramAnchor as Program<MovieReviewProgramAnchor>;

  const movie = {
    title: "Just a test movie",
    description: "Wow what a good movie it was real great",
    rating: 5,
  };

  const [moviePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(movie.title), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  it("Movie review is added", async () => {
    // Add your test here.
    const tx = await program.methods
      .addMovieReview(movie.title, movie.description, movie.rating)
      .accounts({
        movieReview: moviePda,
        initializer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.movieAccountState.fetch(moviePda);
    expect(account.title).to.equal(movie.title);
    expect(account.rating).to.equal(movie.rating);
    expect(account.description).to.equal(movie.description);
    expect(account.reviewer.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
  });

  it("Movie review is updated", async () => {
    const newDescription = "Wow this is new";
    const newRating = 4;

    const tx = await program.methods
      .updateMovieReview(movie.title, newDescription, newRating)
      .accounts({
        movieReview: moviePda,
        initializer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.movieAccountState.fetch(moviePda);
    expect(account.title).to.equal(movie.title);
    expect(account.rating).to.equal(newRating);
    expect(account.description).to.equal(newDescription);
    expect(account.reviewer.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
  });

  it("Deletes a movie review", async () => {
    const tx = await program.methods
      .deleteMovieReview(movie.title)
      .accounts({
        movieReview: moviePda,
        initializer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Try to fetch the account and expect an error (account should not exist)
    try {
      await program.account.movieAccountState.fetch(moviePda);
      assert.fail("The account should not exist after deletion");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });
});
