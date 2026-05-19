window.CARDS = [
  {
    "id": "dtype-defaults",
    "topic": "tensor-creation",
    "q": "What dtype does torch.tensor([1, 2, 3]) get vs torch.tensor([1.0, 2.0, 3.0])? How do you force a specific one?",
    "a": "Int list -> int64. Float list -> float32 (PyTorch's default float, NOT float64 like NumPy).\n\nForce explicitly:\n  torch.tensor([1, 2, 3], dtype=torch.float32)\n\nThis bites you when you mix Python ints with model weights and get a dtype mismatch error."
  },
  {
    "id": "zeros-like",
    "topic": "tensor-creation",
    "q": "What does torch.zeros_like(x) copy from x?",
    "a": "shape, dtype, AND device. Same goes for ones_like, empty_like, randn_like, full_like.\n\nUse this instead of torch.zeros(x.shape) when you want the new tensor on the same GPU as x — saves a manual .to(device)."
  },
  {
    "id": "empty-uninitialized",
    "topic": "tensor-creation",
    "q": "What's the gotcha with torch.empty(3, 4)?",
    "a": "The memory is uninitialised — values are whatever garbage was already in that memory. Reading before writing is a bug.\n\nFine when you're about to overwrite every element (e.g. preallocating a buffer). Otherwise use torch.zeros."
  },
  {
    "id": "randint-bounds",
    "topic": "tensor-creation",
    "q": "What range does torch.randint(0, 10, (3,)) sample from?",
    "a": "Integers in [0, 10) — low inclusive, high EXCLUSIVE. Same convention as Python's range().\n\nIf you want 0..10 inclusive, pass 11 as high."
  },

  {
    "id": "view-vs-reshape",
    "topic": "shape-ops",
    "q": "What's the difference between x.view(2, -1) and x.reshape(2, -1)?",
    "a": "view requires contiguous memory and is guaranteed zero-copy.\nreshape may copy if the tensor is non-contiguous (e.g. after .transpose()).\n\nRule of thumb: use reshape unless you have a specific reason to demand zero-copy. view fails loudly after a transpose; reshape just works."
  },
  {
    "id": "contiguous-when",
    "topic": "shape-ops",
    "q": "When do you need to call .contiguous(), and why?",
    "a": "After ops that change the memory layout view but not the underlying storage — most commonly .transpose() or .permute() — before calling .view().\n\n  x.transpose(0, 1).view(-1)         # ERRORS\n  x.transpose(0, 1).contiguous().view(-1)  # OK\n\nreshape avoids the issue by copying when needed."
  },
  {
    "id": "unsqueeze-squeeze",
    "topic": "shape-ops",
    "q": "What do unsqueeze(0) and squeeze() do? What's the squeeze gotcha?",
    "a": "unsqueeze(d) inserts a dim of size 1 at position d.\nsqueeze() with no args removes ALL dims of size 1.\n\nGotcha: squeeze() with no arg can change shape in ways you didn't intend if any other dim happens to be 1 (e.g. batch size of 1 vanishes). Pass squeeze(-1) to be explicit about which dim."
  },
  {
    "id": "transpose-vs-permute",
    "topic": "shape-ops",
    "q": "Difference between transpose and permute?",
    "a": "transpose(d0, d1) swaps exactly two dims.\npermute(*dims) reorders an arbitrary number of dims (you list the full new order).\n\n  x.transpose(0, 1)          # swap dim 0 and 1\n  x.permute(2, 0, 1)         # full reorder for a 3D tensor"
  },
  {
    "id": "expand-vs-repeat",
    "topic": "shape-ops",
    "q": "Difference between .expand(3, 4) and .repeat(3, 1)? Memory implications?",
    "a": "expand: virtual broadcast, no data copied. The new dims share the same memory — read-only.\nrepeat: actually copies the data, returns a writeable tensor.\n\nExpand is cheap; prefer it. Use repeat only when you need an independent, mutable copy."
  },
  {
    "id": "size-vs-shape",
    "topic": "shape-ops",
    "q": "What do x.shape and x.size(0) return? Are they the same type?",
    "a": "x.shape is a torch.Size object (acts like a tuple).\nx.size(0) is a plain Python int (the size of dim 0).\n\nx.size() with no args is equivalent to x.shape. Use whichever reads better."
  },

  {
    "id": "broadcasting-rules",
    "topic": "broadcasting",
    "q": "State the broadcasting rule.",
    "a": "Compare shapes right-to-left. Each pair of dims must be either:\n  - equal, OR\n  - one of them is 1 (it gets broadcast).\n\nIf a tensor has fewer dims, it's treated as having leading dims of size 1. Otherwise it errors."
  },
  {
    "id": "broadcast-3x1x5",
    "topic": "broadcasting",
    "q": "a is (3, 1, 5), b is (4, 5). What's (a + b).shape?",
    "a": "(3, 4, 5).\n\nRight-to-left: 5 vs 5 (equal). 1 vs 4 (one is 1, broadcasts to 4). 3 vs nothing (b is padded with leading 1, broadcasts to 3)."
  },
  {
    "id": "broadcast-fails",
    "topic": "broadcasting",
    "q": "Give a pair of shapes that CANNOT broadcast together.",
    "a": "Any pair where some dim is neither equal nor 1. E.g.:\n  (3, 4) + (3, 5)  -> error, last dims 4 vs 5\n  (2, 3) + (4, 3)  -> error, leading dims 2 vs 4\n\nWhen debugging, print shapes — most attention bugs come from one wrong unsqueeze."
  },

  {
    "id": "matmul-options",
    "topic": "math-ops",
    "q": "When would you use @, torch.matmul, torch.bmm, and torch.einsum?",
    "a": "@ / torch.matmul: general matmul, handles batched leading dims automatically.\ntorch.bmm: strict batched (B, M, K) @ (B, K, N) -> (B, M, N). Errors if shapes don't match exactly.\ntorch.einsum: explicit; you name every dim. Best when you want zero ambiguity about what's being contracted."
  },
  {
    "id": "einsum-batched-matmul",
    "topic": "math-ops",
    "q": "Write the einsum string for batched matmul: (B, M, K) @ (B, K, N) -> (B, M, N).",
    "a": "torch.einsum('bmk,bkn->bmn', A, B)\n\nThe shared letter (k) marks the dim being contracted. Repeated letters across inputs = sum-product over that dim."
  },
  {
    "id": "dim-trick",
    "topic": "math-ops",
    "q": "What bug appears if you forget dim= on a reduction like .sum() or .softmax()?",
    "a": "Without dim, reductions collapse the ENTIRE tensor to a scalar (sum/mean) or normalise across all elements (softmax). Probably not what you wanted in a model.\n\nAlways pass dim= explicitly. The fact that it's optional is a footgun."
  },
  {
    "id": "keepdim-purpose",
    "topic": "math-ops",
    "q": "Why use keepdim=True on a reduction?",
    "a": "To preserve the reduced dim as size 1 so the result still broadcasts cleanly against the original.\n\nClassic use: normalisation.\n  mu = x.mean(dim=-1, keepdim=True)   # shape (..., 1)\n  x - mu                              # broadcasts back to original shape"
  },
  {
    "id": "max-return",
    "topic": "math-ops",
    "q": "What does x.max(dim=-1) return?",
    "a": "A namedtuple (values, indices). Both have the reduced dim removed.\n\nUse .values or .indices, or unpack: vals, idx = x.max(dim=-1).\n\nIf you only want the indices, use argmax. If you want the global max of the whole tensor (no dim), x.max() returns a scalar tensor."
  },

  {
    "id": "masked-fill-attention",
    "topic": "indexing",
    "q": "How do you apply a causal mask in attention using masked_fill? What value goes in?",
    "a": "  scores.masked_fill(causal_mask == 0, float('-inf'))\n\nThe value MUST be -inf (or a large negative like -1e9). Setting to 0 would let future tokens contribute non-zero probability after softmax — information leak.\n\nThe mask must broadcast against the scores shape (often (B, H, T, T))."
  },
  {
    "id": "gather-shape",
    "topic": "indexing",
    "q": "What shape must idx have for x.gather(dim, idx)?",
    "a": "Same shape as the OUTPUT (which equals x's shape with dim replaced by len(idx) along that axis). In the common case, idx has the same shape as x.\n\nFor each output position, gather picks x[..., idx[...]] along the specified dim. Useful for selecting per-row token IDs out of a logits tensor."
  },
  {
    "id": "ellipsis-indexing",
    "topic": "indexing",
    "q": "What does x[..., -1] do?",
    "a": "Selects the last element along the LAST dim, regardless of how many dims x has. The ellipsis (...) means 'fill in : for all the other dims'.\n\nFor a (B, T, D) tensor, x[..., -1] returns shape (B, T) — last feature of every token."
  },

  {
    "id": "backward-scalar",
    "topic": "autograd",
    "q": "What does .backward() require, and what's the workaround if your tensor isn't scalar?",
    "a": ".backward() only works on a SCALAR tensor (0-d).\n\nIf you have a vector/tensor loss, reduce first:\n  loss.sum().backward()    # or .mean()\n\nAlternatively, pass a gradient tensor of the same shape to backward, but that's rare in training."
  },
  {
    "id": "grad-accumulation",
    "topic": "autograd",
    "q": "Do gradients accumulate or replace on .backward()? How do you handle it in a training loop?",
    "a": "They ACCUMULATE into .grad. Two calls to backward without clearing in between sum the gradients.\n\nClear at the top of each step:\n  optimizer.zero_grad()    # or model.zero_grad()\n\nForgetting this is a common silent bug — loss looks like it's barely moving."
  },
  {
    "id": "requires-grad-leaf",
    "topic": "autograd",
    "q": "Which tensors actually get a .grad populated?",
    "a": "Leaf tensors with requires_grad=True. A leaf is one you created directly (parameters, or tensors constructed with requires_grad=True).\n\nIntermediate tensors in the computation graph do NOT get .grad by default — they participate in backprop, but their gradient isn't stored. If you need it, call .retain_grad() on the intermediate."
  },
  {
    "id": "no-grad-context",
    "topic": "autograd",
    "q": "What does `with torch.no_grad():` do, and when do you use it?",
    "a": "Disables autograd graph construction inside the block. Operations don't track gradients.\n\nUse for:\n  - inference (saves memory, faster)\n  - computing metrics during training\n  - any update to parameters you don't want backprop'd through\n\nSwitch the model to eval mode separately — no_grad doesn't touch dropout/batchnorm behaviour."
  },
  {
    "id": "detach-vs-nograd",
    "topic": "autograd",
    "q": "Difference between y.detach() and `with torch.no_grad():`?",
    "a": ".detach() returns a new tensor SHARING data but disconnected from the graph. Surgical, one tensor.\n\nno_grad() is a context manager that affects every op inside. Broad, all-or-nothing.\n\nUse detach when you want one specific tensor out of the graph (e.g. computing a target from a frozen network). Use no_grad for whole inference passes."
  },

  {
    "id": "super-init",
    "topic": "nn-module",
    "q": "What's the first line of an nn.Module __init__, and what breaks if you skip it?",
    "a": "super().__init__()\n\nIt sets up internal state Module uses to register parameters and submodules. Without it, assigning self.fc = nn.Linear(...) won't actually register the layer — parameters() returns empty, the model trains nothing."
  },
  {
    "id": "forward-call",
    "topic": "nn-module",
    "q": "Should you call model.forward(x) or model(x)? Why?",
    "a": "Always model(x). Calling model() routes through __call__, which runs registered forward/backward hooks and other Module machinery.\n\nCalling model.forward(x) skips all of that. Hooks won't fire, certain features (training/eval mode handling for some layers) may be inconsistent."
  },
  {
    "id": "modulelist-vs-list",
    "topic": "nn-module",
    "q": "What's the bug if you store submodules in a plain Python list?",
    "a": "Plain list -> parameters NOT registered. model.parameters() won't include them, optimizer won't update them, .to(device) won't move them.\n\nUse nn.ModuleList([...]) (or nn.ModuleDict for keyed access). Identical interface for indexing/iteration, but registers everything."
  },
  {
    "id": "count-parameters",
    "topic": "nn-module",
    "q": "Write the one-liner to count trainable parameters in a model.",
    "a": "sum(p.numel() for p in model.parameters() if p.requires_grad)\n\n.numel() is total elements in the tensor. The requires_grad filter matters once you start freezing layers — without it you count frozen params too."
  },
  {
    "id": "containers",
    "topic": "nn-module",
    "q": "When to use nn.Sequential vs nn.ModuleList vs nn.ModuleDict?",
    "a": "Sequential: linear chain where each layer's output feeds the next. Forward is implicit.\nModuleList: list of modules you orchestrate yourself in forward (e.g. variable-depth transformer stack with cross-layer logic).\nModuleDict: same as ModuleList but keyed by name (e.g. one head per task)."
  },

  {
    "id": "ce-targets",
    "topic": "layers",
    "q": "nn.CrossEntropyLoss expects targets in what shape and dtype? One-hot or class indices?",
    "a": "CLASS INDICES (not one-hot), dtype int64 (long).\n\nShapes:\n  logits (B, C),     targets (B,)\n  logits (B, C, T),  targets (B, T)    # for sequences\n\nPassing one-hot is a common bug — runs without error but trains on the wrong thing."
  },
  {
    "id": "ce-logits",
    "topic": "layers",
    "q": "Does nn.CrossEntropyLoss expect raw logits or probabilities? Why does it matter?",
    "a": "Raw LOGITS. It applies log_softmax internally.\n\nIf you apply softmax yourself and pass probabilities, you're effectively doing log_softmax(softmax(x)) — numerically wrong and unstable. Same for adding a Softmax layer at the end of your model when you'll use CE later."
  },
  {
    "id": "bce-with-logits",
    "topic": "layers",
    "q": "Why prefer BCEWithLogitsLoss over BCELoss(sigmoid(x))?",
    "a": "Numerical stability. BCEWithLogitsLoss combines sigmoid + BCE in one op using the log-sum-exp trick, so it doesn't blow up for large positive or negative logits.\n\nSame pattern as CrossEntropyLoss (which combines log_softmax + NLL). Rule of thumb: if there's a 'WithLogits' variant, use it."
  },
  {
    "id": "embedding-purpose",
    "topic": "layers",
    "q": "What does nn.Embedding(num_embeddings, embedding_dim) do?",
    "a": "A lookup table: maps integer indices in [0, num_embeddings) to learnable dense vectors of size embedding_dim.\n\nInput: long tensor of indices, shape (...).\nOutput: float tensor, shape (..., embedding_dim).\n\nThe go-to for token embeddings in transformers. Internally it's equivalent to a Linear layer over one-hot indices, but much cheaper."
  },
  {
    "id": "layernorm-axis",
    "topic": "layers",
    "q": "What dim does nn.LayerNorm(normalized_shape) normalise over by default? Per-sample or across batch?",
    "a": "Over the LAST normalized_shape dims, PER-SAMPLE. Batch and other leading dims are independent.\n\nFor nn.LayerNorm(d_model) applied to (B, T, D): each (B, T) position is normalised across its D features. Different from BatchNorm, which normalises across the batch dim."
  },

  {
    "id": "five-step-order",
    "topic": "training-loop",
    "q": "What's the canonical 5-step order in a PyTorch training step?",
    "a": "  optimizer.zero_grad()      # 1. clear grads (they accumulate)\n  logits = model(x)          # 2. forward\n  loss = loss_fn(logits, y)  # 3. loss\n  loss.backward()            # 4. backward\n  optimizer.step()           # 5. update\n\nOrder matters: zero -> forward -> loss -> backward -> step."
  },
  {
    "id": "missing-backward",
    "topic": "training-loop",
    "q": "What happens if you forget loss.backward()?",
    "a": "No gradients are computed. optimizer.step() runs but has nothing to update (param.grad is still None or whatever it was from the previous step). Loss never decreases.\n\nOne of the most common transformer training bugs — silent, easy to miss."
  },
  {
    "id": "step-before-backward",
    "topic": "training-loop",
    "q": "What happens if you call optimizer.step() BEFORE loss.backward()?",
    "a": "Either an error (param.grad is None on the very first step) or — worse — silent training on stale gradients from the previous iteration.\n\nThe correct order is fixed: zero_grad -> forward -> loss -> backward -> step."
  },
  {
    "id": "adamw-init",
    "topic": "training-loop",
    "q": "What does an optimizer need at construction time?",
    "a": "An iterable of the parameters to optimize, plus hyperparameters:\n  torch.optim.AdamW(model.parameters(), lr=1e-3)\n\nIf you forget to pass parameters or pass an empty iterable, you get an error. If you accidentally pass model.parameters() AFTER moving to GPU, that's still fine — parameters() returns the same tensors regardless of device."
  },

  {
    "id": "dataset-protocol",
    "topic": "data-loading",
    "q": "What two methods must a torch.utils.data.Dataset subclass implement?",
    "a": "__len__(self) -> int: total number of items.\n__getitem__(self, idx): the item at index idx (commonly a (x, y) tuple).\n\nThat's it. Don't pre-stack or pre-pad here — leave batching to DataLoader/collate_fn so __getitem__ stays cheap and parallelizable across workers."
  },
  {
    "id": "collate-purpose",
    "topic": "data-loading",
    "q": "What is collate_fn for? What does the default collate assume?",
    "a": "collate_fn takes a list of items from __getitem__ and assembles them into a batch (typically by stacking).\n\nThe default assumes every item has the same shape — it just torch.stacks them. For variable-length sequences (text, audio), you MUST write a custom collate that pads to the longest item in the batch and returns (padded, lengths, labels)."
  },
  {
    "id": "dataloader-key-args",
    "topic": "data-loading",
    "q": "Most important DataLoader kwargs to know cold?",
    "a": "  DataLoader(\n      dataset,\n      batch_size=32,\n      shuffle=True,             # shuffle indices each epoch\n      collate_fn=my_collate,    # custom batching\n      num_workers=4,            # subprocesses for parallel loading\n      pin_memory=True,          # faster CPU->GPU copy\n      drop_last=False,          # drop incomplete final batch?\n  )"
  },

  {
    "id": "to-tensor-vs-module",
    "topic": "device",
    "q": "Is .to(device) in-place for tensors? For nn.Module?",
    "a": "Tensors: NOT in-place. You must reassign: x = x.to(device).\nModules: IN-PLACE (modifies the module's parameters), but also returns self so model = model.to(device) is fine.\n\nClassic bug: x.to(device) on its own line, then using x — it silently does nothing useful."
  },
  {
    "id": "device-string",
    "topic": "device",
    "q": "Write the idiomatic one-liner to pick CUDA if available, else CPU.",
    "a": "device = 'cuda' if torch.cuda.is_available() else 'cpu'\n\nThen apply uniformly:\n  model = model.to(device)\n  x = x.to(device)\n\nFor multi-GPU you'd use torch.device('cuda:0') etc. Apple Silicon uses 'mps'."
  },
  {
    "id": "to-noop",
    "topic": "device",
    "q": "What's the cost of calling .to(device) on a tensor that's already on that device?",
    "a": "Essentially free — it returns the same tensor without copying. Same for .to(dtype) when the dtype already matches.\n\nThis means you can spam .to(device) defensively at the entry of any function that takes user tensors, without performance worry."
  },

  {
    "id": "train-vs-eval",
    "topic": "mode",
    "q": "What two things does model.eval() change compared to model.train()?",
    "a": "1. Dropout layers turn OFF (use identity).\n2. BatchNorm uses RUNNING stats (the moving average), not the current batch's stats.\n\nLayerNorm and most other layers are unaffected. The change is recursive across all submodules."
  },
  {
    "id": "eval-and-nograd",
    "topic": "mode",
    "q": "Why do you use both model.eval() and torch.no_grad() for inference?",
    "a": "They do different things:\n  model.eval() -> dropout off, batchnorm uses running stats.\n  torch.no_grad() -> autograd graph not built, saves memory and time.\n\nNeither implies the other. For correct, fast inference you need both. Forgetting model.eval() at inference time is a common bug — dropout stays on, metrics become noisy."
  },

  {
    "id": "softmax-stability",
    "topic": "numerical-stability",
    "q": "How is softmax made numerically stable, and what should you NEVER write from scratch?",
    "a": "Subtract the max before exp:\n  exp(x - x.max()) / exp(x - x.max()).sum()\n\nF.softmax does this internally. Don't write exp(x) / exp(x).sum() — for moderately large x (say x=1000), exp(x) overflows to inf and you get NaN."
  },
  {
    "id": "attention-mask-value",
    "topic": "numerical-stability",
    "q": "Why does an attention mask use -inf (or -1e9) and not 0?",
    "a": "The mask is applied BEFORE softmax. softmax(-inf) = 0, so masked positions get zero probability — the desired behaviour.\n\nIf you mask with 0, softmax(0) = exp(0) / Z = 1/Z, so masked positions still get non-trivial probability and future tokens leak into the past in a causal mask. Information leak, model cheats."
  },
  {
    "id": "ce-pattern",
    "topic": "numerical-stability",
    "q": "Why prefer F.cross_entropy(logits, targets) over manually doing log(softmax(x)) + NLLLoss?",
    "a": "Numerical stability and one less moving part. F.cross_entropy uses log_softmax internally (which subtracts the max for stability), then NLL. Doing it by hand with log(softmax(x)) can underflow for very negative logits — log(0) = -inf.\n\nIf you must split them, use F.log_softmax + nn.NLLLoss, not log(softmax(...))."
  },
  {
    "id": "bce-binary",
    "topic": "numerical-stability",
    "q": "What loss for binary classification, and why?",
    "a": "nn.BCEWithLogitsLoss (binary cross-entropy with logits).\n\nReason: same as CrossEntropyLoss — combining sigmoid + BCE in one op avoids the numerical blowup of computing sigmoid(x) separately for extreme x. Don't write BCELoss(sigmoid(x)) by hand."
  },

  {
    "id": "item-shape",
    "topic": "numpy-interop",
    "q": "On what tensors does .item() work?",
    "a": "Only 0-d (scalar) tensors. Calling .item() on anything with multiple elements raises an error.\n\nTo get a Python scalar from a multi-element tensor, reduce first:\n  loss_value = loss.item()                    # loss is already 0-d\n  mean_value = preds.mean().item()            # reduce then extract"
  },
  {
    "id": "to-numpy-grad",
    "topic": "numpy-interop",
    "q": "How do you convert a tensor that has a grad and is on GPU to a numpy array?",
    "a": "  t.detach().cpu().numpy()\n\nOrder matters: detach (break from graph, otherwise .numpy() errors), then cpu (numpy can't see GPU memory), then numpy.\n\nFor a CPU tensor without grad, t.numpy() alone is fine."
  },
  {
    "id": "from-numpy-memory",
    "topic": "numpy-interop",
    "q": "Does torch.from_numpy(arr) copy the data?",
    "a": "No — SHARED memory. Modifying the numpy array modifies the tensor and vice versa (as long as both are on CPU).\n\nIf you want an independent copy, follow with .clone(). torch.tensor(arr) (note: not from_numpy) DOES copy."
  },

  {
    "id": "manual-seed",
    "topic": "reproducibility",
    "q": "torch.manual_seed(0) sets one seed. What else do you typically seed for full reproducibility?",
    "a": "  torch.manual_seed(0)\n  numpy.random.seed(0)         # if you use numpy randomness\n  random.seed(0)               # if you use Python's random (e.g. shuffling)\n\nFor CUDA determinism additionally: torch.use_deterministic_algorithms(True). Usually unnecessary for quick experiments."
  },

  {
    "id": "mse-vs-mae-vs-huber",
    "topic": "losses",
    "q": "When do you pick MSE vs MAE vs Huber for regression?",
    "a": "MSE: clean targets. Smooth, grad scales with residual, MLE under Gaussian noise. Outliers dominate.\nMAE / L1: outlier-heavy. Constant grad magnitude — outliers don't pull the fit. Non-diff at 0.\nHuber / SmoothL1: best of both. Quadratic for |residual| <= delta, linear past that.\n\nRule: clean data -> MSE; tails or label noise -> MAE or Huber."
  },
  {
    "id": "ce-takes-logits",
    "topic": "losses",
    "q": "Does F.cross_entropy take logits or probabilities? Why?",
    "a": "LOGITS. Never softmax before passing in.\n\nF.cross_entropy fuses log_softmax + NLL internally, computing -z[y] + logsumexp(z) — the numerically stable form. Pre-softmaxing applies the squashing twice and trains poorly. Pre-log-softmaxing breaks the logsumexp trick.\n\nSame story for BCEWithLogitsLoss vs BCELoss(sigmoid(x))."
  },
  {
    "id": "ce-kl-nll",
    "topic": "losses",
    "q": "Relationship between cross-entropy, KL divergence, and NLL / MLE?",
    "a": "H(p, q) = -sum p log q       (cross-entropy)\nKL(p || q) = H(p, q) - H(p)\n\nFor one-hot labels, H(p) = 0, so minimizing CE = minimizing KL.\n\nAlso: minimizing CE = maximizing log-likelihood (MLE) when q is a Categorical model. Three names, one objective."
  },

  {
    "id": "relu-derivative",
    "topic": "activations",
    "q": "What is the derivative of ReLU?",
    "a": "f(x)  = max(0, x)\nf'(x) = 1 if x > 0 else 0\n\nAt x = 0 it's undefined; PyTorch returns 0 (a valid subgradient).\n\nBackward only needs the mask (x > 0) — that's why ReLU saves so little memory. The mask zeros out grad for any neuron whose pre-activation was negative ('dying ReLU' if a neuron's pre-act stays negative permanently)."
  },
  {
    "id": "sigmoid-derivative",
    "topic": "activations",
    "q": "Derivative of sigmoid? Why is it a vanishing-gradient risk?",
    "a": "sigma(x)  = 1 / (1 + e^-x)\nsigma'(x) = sigma(x) * (1 - sigma(x))\n\nMax value of sigma' is 0.25 (at x = 0). At |x| > 4 it's near zero — the activation 'saturates.'\n\nIn deep networks the chain rule multiplies all these <= 0.25 factors together -> grads shrink exponentially with depth. That's the vanishing-grad problem. Fix: ReLU/GELU + residuals + LayerNorm."
  },
  {
    "id": "softmax-ce-grad",
    "topic": "activations",
    "q": "What is the gradient of softmax + cross-entropy with respect to the logits?",
    "a": "dL/dz = p - y_onehot           (where p = softmax(z))\n\nThe messy softmax Jacobian s_i(delta_ij - s_j) collapses against cross-entropy's dL/ds into this clean expression. No softmax derivative to evaluate, no log derivative.\n\nThis is why F.cross_entropy fuses the two ops and why every transformer head's output layer is built around it."
  },

  {
    "id": "bias-variance-defs",
    "topic": "bias-variance",
    "q": "Bias vs variance — what does each mean?",
    "a": "E[(y - y_hat)^2] = Bias[y_hat]^2 + Var[y_hat] + sigma^2\n\nBias: systematic error — the model's average prediction is wrong (underfitting).\nVariance: sensitivity to training data — model changes a lot with small data perturbations (overfitting).\nsigma^2: irreducible noise.\n\nCapacity up -> bias down, variance up. Data up -> variance down. Ensembling kills variance, not bias."
  },
  {
    "id": "diagnose-from-curves",
    "topic": "bias-variance",
    "q": "How do you diagnose underfit vs overfit from train/val curves?",
    "a": "Train high + val high (small gap): UNDERFIT. Fix: bigger model, more features, less regularization, train longer.\nTrain low + val high (big gap): OVERFIT. Fix: more data, regularization (dropout/L2), augmentation, smaller model, early stopping.\nBoth low + small gap: well-fit.\nTrain low + val low + test high: distribution shift or split leakage."
  },

  {
    "id": "dropout-train-vs-eval",
    "topic": "regularization",
    "q": "What does dropout do at train vs eval, and what scaling does it apply?",
    "a": "Train: zero each activation independently with prob p, then SCALE survivors by 1/(1-p) ('inverted dropout'). Expected activation magnitude stays the same.\nEval: identity (no dropping, no scaling).\n\nmodel.eval() flips the switch. Forgetting it leaves dropout on at eval — gives inconsistent metrics."
  },
  {
    "id": "adamw-vs-adam-l2",
    "topic": "regularization",
    "q": "Why does AdamW exist? What's wrong with Adam + L2 weight decay?",
    "a": "L2 adds lambda*w to the GRADIENT. Adam then divides by sqrt(v_hat) (RMS of past grads). So params with large historical gradients get LESS decay than params with small ones — opposite of what you want.\n\nAdamW DECOUPLES weight decay: apply w <- w(1 - lambda*lr) AFTER the Adam step, independent of moments. For transformers, always use AdamW."
  },
  {
    "id": "l1-vs-l2-effect",
    "topic": "regularization",
    "q": "What's the difference between L1 and L2 regularization in terms of effect on weights?",
    "a": "L2 (sum w^2): shrinks all weights smoothly toward 0; rarely makes them exactly 0. Equivalent to a Gaussian prior on weights.\nL1 (sum |w|): encourages SPARSITY — many weights become exactly 0. Equivalent to a Laplace prior.\n\nL2 is the default in deep nets (smoothness, plays well with Adam-style updates). L1 when you want feature selection or interpretable sparsity."
  },

  {
    "id": "linear-grad-formulas",
    "topic": "backprop",
    "q": "Gradients for a linear layer y = xW + b given dL/dy?",
    "a": "dL/dW = x^T @ (dL/dy)       # outer product, shape (in, out)\ndL/db = (dL/dy).sum(dim=batch) # sum over batch, shape (out,)\ndL/dx = (dL/dy) @ W^T          # for upstream gradient flow\n\nMnemonic: 'transpose what's on the other side.' For dL/dW, x is the other input — transpose x. For dL/dx, W is the other input — transpose W."
  },
  {
    "id": "fused-softmax-ce-stability",
    "topic": "backprop",
    "q": "Why is the fused softmax + cross-entropy more stable than computing them separately?",
    "a": "Direct: softmax(z)[y] -> log -> negate. exp(z) overflows for large z; log(0) underflows for small z.\nFused (logsumexp trick): L = -z[y] + logsumexp(z). logsumexp(z) = max(z) + log(sum(exp(z - max(z)))). Subtracting max keeps all exponents <= 0 — bounded.\n\nAnd the backward is clean: dL/dz = p - y_onehot. That's why F.cross_entropy takes logits, not probs."
  },

  {
    "id": "vanishing-causes-fixes",
    "topic": "gradients",
    "q": "What causes vanishing gradients, and what are the standard fixes?",
    "a": "Causes:\n- Saturating activations (sigmoid sigma' <= 0.25, tanh near +-1)\n- Bad init (weights too small)\n- Very deep nets with no skip connections\n\nFixes:\n- ReLU / GELU in hidden layers (derivative 1 in active region)\n- RESIDUAL connections: y = x + F(x), dy/dx = I + dF/dx — identity path has grad 1\n- LayerNorm / BatchNorm (keeps activation scale stable)\n- He/Kaiming init"
  },
  {
    "id": "grad-clipping-api",
    "topic": "gradients",
    "q": "How do you clip gradients in PyTorch, and where in the training loop?",
    "a": "torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n\nCall it BETWEEN loss.backward() and optimizer.step() — clipping happens to .grad before the step.\n\nRescales every grad so the total L2 norm <= max_norm. Standard hammer for exploding gradients (NaN loss, sudden grad_norm spikes). Common values: 1.0 for transformers, 5.0 for RNNs."
  },

  {
    "id": "xavier-vs-he",
    "topic": "init",
    "q": "When do you use Xavier (Glorot) vs He (Kaiming) initialization?",
    "a": "Xavier / Glorot: Var(W) = 2 / (fan_in + fan_out). For activations symmetric around 0 — tanh, sigmoid.\nHe / Kaiming: Var(W) = 2 / fan_in. For ReLU family (half the neurons are zero, active half needs more variance).\n\nGoal in both: keep activation variance roughly constant across layers so it doesn't blow up or vanish. PyTorch's nn.Linear default is Kaiming-uniform."
  },
  {
    "id": "why-not-zeros",
    "topic": "init",
    "q": "Why can't you initialize neural network weights to zero?",
    "a": "All neurons in a layer would compute the SAME activations and the SAME gradients — they'd update identically forever. The network would behave like one neuron per layer no matter how wide it is.\n\nYou need random init to BREAK SYMMETRY. Biases CAN be zero (no symmetry problem — each bias is attached to a unique neuron whose weights are already distinct)."
  },

  {
    "id": "bn-train-vs-eval",
    "topic": "normalization",
    "q": "How does BatchNorm behave differently at train vs eval?",
    "a": "Train: normalize using THIS batch's mean and variance; also update a running EMA of those stats.\nEval (model.eval()): normalize using the STORED running stats — not the eval batch.\n\nForgetting model.eval() at validation leaves BN in train mode, so it normalizes by the val batch's stats. Small val batches -> noisy estimates -> bouncing val loss. Same gotcha as dropout."
  },
  {
    "id": "ln-vs-bn-transformers",
    "topic": "normalization",
    "q": "Why do transformers use LayerNorm instead of BatchNorm?",
    "a": "LN computes stats WITHIN one sample (over the feature dim). Independent of batch size and of other tokens in the sequence.\n\nReasons it fits transformers:\n- Variable-length sequences (BN's per-position stats become unreliable with padding)\n- Small / variable batch sizes during training and inference\n- No train/eval mode difference — simpler and more stable\n\nModern stacks (Llama) use RMSNorm — LN minus the mean, even faster."
  },

  {
    "id": "adam-update-intuition",
    "topic": "optimizers",
    "q": "What does the Adam update do intuitively?",
    "a": "Adam tracks per-param running averages of:\n  m = first moment   (~ mean of recent grads)\n  v = second moment  (~ variance of recent grads)\n\nThen w <- w - lr * m_hat / (sqrt(v_hat) + eps).\n\nEffect: each parameter gets its OWN effective learning rate. Params with consistently large grads (large sqrt(v_hat)) get downscaled; rarely-updated params get amplified. Robust to weird gradient magnitudes — that's why it's the default."
  },
  {
    "id": "warmup-cosine",
    "topic": "optimizers",
    "q": "What is linear warmup + cosine decay, and why is it the transformer default?",
    "a": "Linear warmup: ramp lr from 0 to peak over the first K steps.\nCosine decay: smoothly decrease lr from peak to ~0 over the rest of training.\n\nWhy warmup: Adam's moment estimates m and v are noisy in the first few hundred steps; large lr can blow up. Ramping up gives the moments time to stabilize.\n\nWhy cosine: gentler than step decay, settles to small lr at the end for fine convergence."
  },

  {
    "id": "accuracy-fails-imbalance",
    "topic": "eval",
    "q": "Why is accuracy misleading on imbalanced datasets, and what should you use instead?",
    "a": "99% negative / 1% positive: predicting 'always negative' gets 99% accuracy and is useless.\n\nUse:\n- F1 (harmonic mean of precision and recall)\n- Precision-recall curve, AUPRC (better than ROC-AUC under heavy imbalance)\n- Per-class precision / recall\n- Confusion matrix\n\nROC-AUC also gets misleading when negatives vastly outnumber positives — FPR stays low even for a bad model."
  },
  {
    "id": "precision-vs-recall",
    "topic": "eval",
    "q": "Precision vs recall — when do you optimize for which?",
    "a": "Precision = TP / (TP + FP) — of those I called positive, how many really were.\nRecall    = TP / (TP + FN) — of all actual positives, how many did I catch.\n\nRecall-critical: disease screening, fraud detection — missing a positive is expensive.\nPrecision-critical: spam filter, search ranking — false positives annoy users.\nBalanced: F1.\n\nYou can usually trade one for the other by moving the decision threshold."
  },

  {
    "id": "entropy-ce-kl",
    "topic": "prob-stats",
    "q": "Define entropy, cross-entropy, and KL divergence and how they relate.",
    "a": "H(p)        = -sum p(x) log p(x)              # entropy: uncertainty in p\nH(p, q)     = -sum p(x) log q(x)              # cross-entropy\nKL(p || q)  = sum p(x) log(p(x) / q(x))\n            = H(p, q) - H(p)                  # always >= 0, = 0 iff p == q\n\nKL is NOT symmetric: KL(p||q) != KL(q||p). For fixed labels (one-hot p), H(p) = 0 so minimizing CE = minimizing KL = maximizing log-likelihood."
  },
  {
    "id": "mle-mlap-weight-decay",
    "topic": "prob-stats",
    "q": "Why is L2 weight decay equivalent to a Gaussian prior? And what's MLE vs MAP?",
    "a": "MLE: argmax_theta  log p(D | theta)                    -> minimize negative log-likelihood\nMAP: argmax_theta  log p(D | theta) + log p(theta)    -> MLE + prior term\n\nGaussian prior  N(0, sigma^2) on weights -> log p(theta) is proportional to -||theta||^2 -> L2 penalty.\nLaplace prior -> L1 penalty.\n\nSo 'weight decay' is just doing MAP estimation with a Gaussian prior on weights — the Bayesian reading of regularization."
  }
];
