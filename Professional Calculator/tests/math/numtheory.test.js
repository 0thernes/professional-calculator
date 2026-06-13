/**
 * @jest-environment node
 */
import {
    gcd, lcm, extendedGcd, modPow, modPowBig, modInverse, modInverseBig,
    isPrime, isPrimeBig, primeFactors, factorization, divisors, nextPrime,
    eulerTotient, fibonacci, fibonacciBig, isPerfectSquare,
} from '../../math/numtheory.js';

describe('numtheory — gcd/lcm/extended', () => {
    test('gcd(48,18)=6', () => expect(gcd(48, 18)).toBe(6));
    test('gcd coprime = 1', () => expect(gcd(17, 13)).toBe(1));
    test('lcm(4,6)=12', () => expect(lcm(4, 6)).toBe(12));
    test('lcm with 0 = 0', () => expect(lcm(0, 5)).toBe(0));
    test('extendedGcd: a·x+b·y=g', () => {
        const { g, x, y } = extendedGcd(240n, 46n);
        expect(g).toBe(2n);
        expect(240n * x + 46n * y).toBe(g);
    });
});

describe('numtheory — modular arithmetic', () => {
    test('modPow(2,10,1000)=24', () => expect(modPow(2, 10, 1000)).toBe(24));
    test('Fermat: 2^(p-1) ≡ 1 mod p', () => expect(modPow(2, 16, 17)).toBe(1));
    test('modPow mod 1 = 0', () => expect(modPow(5, 3, 1)).toBe(0));
    test('large modPow exact (BigInt)', () =>
        expect(modPowBig(7n, 256n, 13n)).toBe(9n)),
    test('modInverse(3,11)=4 (3·4=12≡1)', () => expect(modInverse(3, 11)).toBe(4));
    test('modInverse(a,m)·a ≡ 1', () => {
        const inv = modInverse(17, 3120); // classic RSA d for e=17
        expect((17 * inv) % 3120).toBe(1);
    });
    test('no inverse when not coprime throws', () => expect(() => modInverse(6, 9)).toThrow(RangeError));
});

describe('numtheory — primality', () => {
    test('small primes', () => {
        expect(isPrime(2)).toBe(true);
        expect(isPrime(97)).toBe(true);
        expect(isPrime(1)).toBe(false);
        expect(isPrime(91)).toBe(false); // 7×13
    });
    test('Mersenne prime 2^31−1 = 2147483647 is prime', () => expect(isPrime(2147483647)).toBe(true));
    test('Carmichael 561 is composite', () => expect(isPrime(561)).toBe(false));
    test('large prime via BigInt', () => expect(isPrimeBig(1000000007n)).toBe(true));
    test('large composite via BigInt', () => expect(isPrimeBig(1000000007n * 3n)).toBe(false));
    test('nextPrime(100)=101', () => expect(nextPrime(100)).toBe(101));
    test('nextPrime(0)=2', () => expect(nextPrime(0)).toBe(2));
});

describe('numtheory — factorization & divisors', () => {
    test('primeFactors(360)=[2,2,2,3,3,5]', () => expect(primeFactors(360)).toEqual([2, 2, 2, 3, 3, 5]));
    test('primeFactors of a prime', () => expect(primeFactors(97)).toEqual([97]));
    test('primeFactors(1)=[]', () => expect(primeFactors(1)).toEqual([]));
    test('factorization(360)=[[2,3],[3,2],[5,1]]', () =>
        expect(factorization(360)).toEqual([[2, 3], [3, 2], [5, 1]])),
    test('product of prime factors = n', () => {
        const n = 8400;
        expect(primeFactors(n).reduce((a, b) => a * b, 1)).toBe(n);
    });
    test('divisors(28)=[1,2,4,7,14,28] (perfect)', () => expect(divisors(28)).toEqual([1, 2, 4, 7, 14, 28]));
    test('divisors of a prime', () => expect(divisors(13)).toEqual([1, 13]));
    test('perfect number: divisors sum to 2n', () => {
        const d = divisors(496); // perfect number
        expect(d.reduce((a, b) => a + b, 0)).toBe(2 * 496);
    });
});

describe('numtheory — arithmetic functions', () => {
    test('φ(36)=12', () => expect(eulerTotient(36)).toBe(12));
    test('φ(prime p)=p−1', () => expect(eulerTotient(97)).toBe(96));
    test('φ(1)=1', () => expect(eulerTotient(1)).toBe(1));
    test('Euler product: φ(p·q)=(p−1)(q−1)', () => expect(eulerTotient(3 * 5)).toBe(2 * 4));
    test('fibonacci(10)=55', () => expect(fibonacci(10)).toBe(55));
    test('fibonacci(0)=0, (1)=1', () => {
        expect(fibonacci(0)).toBe(0);
        expect(fibonacci(1)).toBe(1);
    });
    test('fibonacci recurrence F(n)=F(n−1)+F(n−2)', () =>
        expect(fibonacci(20)).toBe(fibonacci(19) + fibonacci(18))),
    test('fibonacciBig(100) exact', () =>
        expect(fibonacciBig(100)).toBe(354224848179261915075n)),
    test('negative fib throws', () => expect(() => fibonacci(-1)).toThrow(RangeError));
    test('isPerfectSquare', () => {
        expect(isPerfectSquare(144)).toBe(true);
        expect(isPerfectSquare(145)).toBe(false);
        expect(isPerfectSquare(0)).toBe(true);
    });
});
