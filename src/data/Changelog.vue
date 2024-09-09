<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <h2>Changelog</h2>
        </template>
        <template v-slot:body>
            <details open>
                <summary>v1.0 Revitalization</summary>
                v1.0.0 Rewrite in Profectus - <time>2024-09-09</time><br/>
                It's been a while, hasn't it?
                <ul>
                    <li class="breaking">Moved from TMT to Profectus</li>
                    <li class="breaking">Save system reworked entirely</li>
                    <li class="feature">Save Bank added with important milestones</li>
                    <li class="breaking">Overhauled Skyrmion, Acceleron, and Inflaton visuals</li>
                    <li class="balancing">Found a few calculation errors very early on, had to rebalance <i>everything</i></li>
                    <li class="balancing">Skyrmion upgrade costs modified</li>
                    <li class="balancing">Deep Abyssal content is now more difficult</li>
                    <li class="balancing">Foam re-formation costs are now static rather than calculated</li>
                    <li class="feature">Added a new Abyssal Foam milestone</li>
                    <li class="balancing">Some Accleron milestone requirements increased</li>
                    <li class="balancing">Mid-range Acceleron upgrade costs increased to match pace</li>
                    <li class="balancing">Post-Inflaton Acceleron cost scaling modified</li>
                    <li class="feature">Entropic Selector presets are now unlimited</li>
                    <li class="balancing">Timecube upgrade costs modified slightly</li>
                    <li class="balancing">Inflaton feature unlock requirements modified</li>
                    <li class="balancing">Post-Acceleron Inflaton scaling modified</li>
                    <li class="balancing">String entanglement requirements rebalanced</li>
                </ul>
            </details>
            <details open>
                <summary>v0.8 Fragmentation</summary>
                v0.8.2 Big Timeline Rebalance - <time>2021-12-17</time>
                <ul>
                    <li class="balancing">Top score now scales similarly to the other resources - this is a buff at low amounts, but a nerf later</li>
                    <li class="balancing">Level 1 Top timeline nerfed from /1e6 -> /1e3</li>
                    <li class="balancing">'Tower' timecube upgrade reworked, now provides Foam retainment to Skyrmion resources</li>
                    <li class="balancing">Base timeline score divisor reduced from /1e6 -> /1e4</li>
                    <li class="balancing">Fourth row timecube upgrades reduced in price</li>
                    <li class="balancing">Entanglement requirements reduced to compensate for reduced scores</li>
                </ul>
                v0.8.1 A few bugfixes - <time>2021-12-10</time>
                <ul>
                    <li class="fix">Fix a few more bugs</li>
                    <li class="fix">Acceleron upgrades are now always visible after entangling</li>
                </ul>
                v0.8 Timecube Expansion - <time>2021-11-14</time>
                <ul>
                    <li class="feature">Graphical changes to many features</li>
                    <li class="fix">A few more bugfixes</li>
                    <li class="feature">Timecube layer expanded to a full layer's worth of content after purchasing the relevant Inflaton upgrade</li>
                    <li class="feature">Subspatial Construction now takes priority over other repeatables, if it is the cheapest available</li>
                    <li class="feature">Added three slots for entropic enhancement presets</li>
                </ul>
            </details>
            <details open>
                <summary>v0.7 Prioritization</summary>
                v0.7.1 A few bugfixes - <time>2021-08-02</time>
                <ul>
                    <li class="fix">Lots of little bugfixes</li>
                    <li class="fix">Enter the Abyss challenge is now moved into its own row-3 layer, for proper reset handling (it's still living in Skyrmions though)</li>
                    <li class="fix">Added initialization checks to save loading to get the extra abyss layer data read correctly</li>
                </ul>
                v0.7.0 The beginnings of expansion - <time>2021-07-21</time>
                <ul>
                    <li class="fix">Update to TMT 2.6.5.1</li>
                    <li class="feature">Tons of backend changes, improvements, and future systems</li>
                    <li class="feature">Added five new content-selector upgrades (only one implemented so far)</li>
                    <li class="feature">Four more repeatable Pion and Spinor upgrades each</li>
                    <li class="feature">An optional challenge to beat to unlock their automation</li>
                    <li class="feature">Official support for pausing the game (if you feel like it)</li>
                    <li class="fix">player.universeTab should definitely be "none", not "standard"</li>
                </ul>
            </details>
            <details open>
                <summary>v0.6 Amplification</summary>
                v0.6.0 The End of Inflation - <time>2021-06-03</time>
                <ul>
                    <li class="fix">Updated to TMT 2.5.11.1</li>
                    <li class="feature">Filled out the Inflaton layer</li>
                    <li class="balancing">Initial balance pass for both Acceleron- and Inflaton-first playthroughs</li>
                    <li class="feature">Added a help tab, with information on each major layer</li>
                    <li class="feature">Various improvements to background systems</li>
                    <li class="feature">Added the initial framework for the final phase 1 layer</li>
                </ul>
            </details>
            <details open>
                <summary>v0.5 Dilation</summary>
                v0.5.0 Completing the Cycle - <time>2021-05-02</time>
                <ul>
                    <li class="feature">Finished Acceleron layer up to Inflaton unlock</li>
                    <li class="balancing">Nerfed higher resource Acceleron and Quantum Foam effects (while likely drop those nerfs by a lot later)</li>
                    <li class="fix">Re-enabled Inflaton layer, but with nothing in there yet</li>
                </ul>
            </details>
            <details open>
                <summary>v0.4 Crystallization</summary>
                v0.4.0 Entropic Replacement - <time>2021-04-29</time>
                <ul>
                    <li class="fix">Updated to TMT 2.4</li>
                    <li class="balancing">Rebalanced everything from Foam unlock through Time Cubes</li>
                    <li class="feature">Replaced Entropic Enhancement selectors with more defined upgrade selections</li>
                    <li class="fix">Fixed some typos and clarity issues</li>
                </ul>
            </details>
            <details open>
                <summary>v0.3 Acceleration</summary>
                v0.3.3 A minor reduction - <time>2021-04-22</time>
                <ul>
                    <li class="balancing">Merge first two Acceleron milestones</li>
                </ul>
                v0.3.2 A couple more bugfixes - <time>2021-04-22</time>
                <ul>
                    <li class="fix">Fixed Skyrmion and Acceleron upgrades being buyable without enough points</li>
                    <li class="feature">Added Buy All buttons and hotkeys for Skyrmion and Foam layers, and shifted around milestones to unlock them</li>
                </ul>
                v0.3.1 A bugfix - <time>2021-04-21</time>
                <ul>
                    <li class="fix">Fixed Skyrmions and Foam not generating without Entropic Loop 2</li>
                </ul>
                v0.3.0 The start of a new era - <time>2021-04-21</time>
                <ul>
                    <li class="feature">Started work on Inflatons</li>
                    <li class="feature">Implemented first half of Accelerons</li>
                    <li class="balancing">Deflated higher Skyrmion and Foam amounts</li>
                    <li class="balancing">Minor rebalance to shift end-of-Foam to intended route</li>
                </ul>
            </details>
            <details open>
                <summary>v0.2 Formation</summary>
                v0.2.0 Bubbling up to new heights - <time>2021-04-15</time>
                <ul>
                    <li class="feature">Added Infinitesimal through Quantum Foam boosts and buyables</li>
                    <li class="feature">Added Foam milestones</li>
                    <li class="balancing">Rebalanced Foam formation levels</li>
                    <li class="balancing">Rebalanced Pion and Spinor α and γ buyables</li>
                    <li class="feature">Added 6 more Pion and Spinor buyables each</li>
                    <li class="feature">Added Pion and Spinor autobuyer upgrades</li>
                    <li class="feature">Barebones third row added - no content yet</li>
                </ul>
            </details>
            <details open>
                <summary>v0.1 Creation</summary>
                v0.1.0 In the very beginning - <time>2021-04-09</time>
                <ul>
                    <li class="feature">Added two layers, Skyrmion and Foam</li>
                    <li class="feature">Pre-foam Skyrmion complete</li>
                    <li class="feature">Protoversal Foam sub-layer and Skyrmion buyables complete</li>
                    <li class="feature">Added framework for Infinitesimal through Quantum Foam sub-layers</li>
                </ul>
            </details>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import Modal from "components/Modal.vue";
import { ref } from "vue";

const isOpen = ref(false);

defineExpose({
    open() {
        isOpen.value = true;
    }
});
</script>

<style scoped>
details {
    margin: 10px 0;
    padding-left: 18px;
}

summary {
    cursor: pointer;
    margin-bottom: 10px;
    margin-left: -18px;
}

ul {
    margin: var(--feature-margin) 0;
    background: var(--raised-background);
    border: 2px solid rgba(0, 0, 0, 0.125);
    padding: 5px 5px 5px 15px;
    list-style: inside;
}

li {
    margin: 8px 0;
}

li::before {
    padding: 2px 8px;
    margin-right: 8px;
    border-radius: var(--border-radius);
}

.feature::before {
    content: "Feature";
    background: var(--changelog-feature);
}

.fix::before {
    content: "Fix";
    background: var(--changelog-fix);
}

.balancing::before {
    content: "Balancing";
    background: var(--changelog-balance);
}

.breaking::before {
    content: "Breaking";
    background: var(--danger);
}
</style>
