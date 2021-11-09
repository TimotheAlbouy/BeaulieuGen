<template>
<div>
	<b-navbar type="dark" variant="info">
		<b-navbar-brand href="#">Générateur PDF de messes</b-navbar-brand>
	</b-navbar>

	<b-container>
		<b-form-group label="Chant d'entrée" label-for="entrance">
			<b-form-select id="entrance"
				v-model="entrance" :options="entranceOptions"
			/>
		</b-form-group>

		<b-form-group label="Prière universelle" label-for="universalPrayer">
			<b-form-select id="universalPrayer"
				v-model="universalPrayer" :options="universalPrayerOptions"
			/>
		</b-form-group>

		<b-form-group label="Offertoire" label-for="offertory">
			<b-form-select id="offertory"
				v-model="offertory" :options="offertoryOptions"
			/>
		</b-form-group>

		<b-form-group label="Communion" label-for="communion">
			<b-form-select id="communion"
				v-model="communion" :options="communionOptions"
			/>
		</b-form-group>

		<b-form-group label="Envoi" label-for="sending">
			<b-form-select id="sending"
				v-model="sending" :options="sendingOptions"
			/>
		</b-form-group>

		<b-button variant="primary" @click="savePdf">
			Générer le PDF
		</b-button>
	</b-container>
</div>
</template>

<script>
import {
	BNavbar, BNavbarBrand,
	BContainer,
	BFormGroup, BFormSelect,
	BButton
} from "bootstrap-vue";
import axios from "axios";
import jsPDF from "jspdf";

import {
	KYRIE_LATIN, KYRIE_FRENCH,
	SANCTUS_LATIN, SANCTUS_FRENCH,
	AGNUS_LATIN, AGNUS_FRENCH
} from "./constants";

export default {
	name: "App",
	components: {
		BNavbar, BNavbarBrand,
		BContainer,
		BFormGroup, BFormSelect,
		BButton
	},
	data() {
		return {
			doc: null,
			entrance: null,
			universalPrayer: null,
			offertory: null,
			communion: null,
			sending: null,
			entranceOptions: [],
			universalPrayerOptions: [],
			offertoryOptions: [],
			communionOptions: [],
			sendingOptions: [],
			verseNumber: 0
		};
	},
	async mounted() {
		const endpoint = "textes/";
		this.entranceOptions = (await axios.get(endpoint + "entree.txt")).data.split(/\r?\n/);
		this.universalPrayerOptions = (await axios.get(endpoint + "priere_universelle.txt")).data.split(/\r?\n/);
		this.offertoryOptions = (await axios.get(endpoint + "offertoire.txt")).data.split(/\r?\n/);
		this.communionOptions = (await axios.get(endpoint + "communion.txt")).data.split(/\r?\n/);
		this.sendingOptions = (await axios.get(endpoint + "envoi.txt")).data.split(/\r?\n/);
	},
	methods: {
		addPage() {
			const width = this.doc.internal.pageSize.getWidth();
			const height = this.doc.internal.pageSize.getHeight();
			this.doc.addPage();
			this.doc.setFillColor(33, 33, 33);
			this.doc.rect(0, 0, width, height, 'F');
		},
		addOrdinarySong(title, latinLyrics, frenchLyrics) {
			const width = this.doc.internal.pageSize.getWidth();
			this.doc.setFontSize(30);
			this.doc.text(title, 10, 20);
			this.doc.setFontSize(20);
			this.doc.setFont(undefined, "italic");
			this.doc.text("Latin", 20, 40);
			this.doc.text("Français", width/2 + 10, 40);
			this.doc.setFont(undefined, "normal");
			const splitLatin = this.doc.splitTextToSize(latinLyrics, width/2 - 30);
			this.doc.text(splitLatin, 20, 60);
			const splitFrench = this.doc.splitTextToSize(frenchLyrics, width/2 - 30);
			this.doc.text(splitFrench, width/2 + 10, 60);
		},
		addNonOrdinarySong(title, lyrics) {
			const width = this.doc.internal.pageSize.getWidth();
			const height = this.doc.internal.pageSize.getHeight();
			this.verseNumber = 1;
			this.doc.setFontSize(30);
			this.doc.text(title, 10, 20);
			this.doc.setFontSize(20);
			const lineHeight = this.doc.getTextDimensions('text').h;
			if (lyrics.length == 1) {
				const splitP1 = this.doc.splitTextToSize(lyrics[0], width - 40);
				this.addParagraph(splitP1, 20, height/3);
			} else if (lyrics.length == 2) {
				const yP1 = 40;
				const splitP1 = this.doc.splitTextToSize(lyrics[0], width - 40);
				this.addParagraph(splitP1, 20, yP1);
				const yP2 = yP1 + splitP1.length * lineHeight + 20;
				const splitP2 = this.doc.splitTextToSize(lyrics[1], width - 40);
				this.addParagraph(splitP2, 20, yP2);
			} else if (lyrics.length == 3) {
				const yP1 = 40;
				const splitP1 = this.doc.splitTextToSize(lyrics[0], width - 40);
				this.addParagraph(splitP1, 20, yP1);
				const yP2 = yP1 + splitP1.length * lineHeight + 20;
				const splitP2 = this.doc.splitTextToSize(lyrics[1], width - 40);
				this.addParagraph(splitP2, 20, yP2);
				const yP3 = yP2 + splitP2.length * lineHeight + 20;
				const splitP3 = this.doc.splitTextToSize(lyrics[2], width - 40);
				this.addParagraph(splitP3, 20, yP3);
			} else if (lyrics.length >= 4) {
				const splitP1 = this.doc.splitTextToSize(lyrics[0], width/2 - 30);
				this.addParagraph(splitP1, 20, 40);
				const splitP2 = this.doc.splitTextToSize(lyrics[1], width/2 - 30);
				this.addParagraph(splitP2, 20, height/2 + 10);
				const splitP3 = this.doc.splitTextToSize(lyrics[2], width/2 - 30);
				this.addParagraph(splitP3, width/2 + 10, 40);
				const splitP4 = this.doc.splitTextToSize(lyrics[3], width/2 - 30);
				this.addParagraph(splitP4, width/2 + 10, height/2 + 10);
			}
		},
		addParagraph(paragraph, x, y) {
			this.doc.setFontSize(20);
			const isChorus = paragraph[0].startsWith("R.");
			if (isChorus) {
				this.doc.setFont(undefined, "bold");
				this.doc.text(paragraph, x, y);
				this.doc.setFont(undefined, "normal");
			} else {
				paragraph[0] = this.verseNumber + ". " + paragraph[0];
				this.doc.text(paragraph, x, y);
				this.verseNumber++;
			}
		},
		async getNonOrdinarySongs() {
			const endpoint = "textes/chants/";
			const entranceSong = (await axios.get(endpoint + this.entrance + ".txt"))
				.data.split(/\r?\n\r?\n/);
			const offertorySong = (await axios.get(endpoint + this.offertory + ".txt"))
				.data.split(/\r?\n\r?\n/);
			const communionSong = (await axios.get(endpoint + this.communion + ".txt"))
				.data.split(/\r?\n\r?\n/);
			const sendingSong = (await axios.get(endpoint + this.sending + ".txt"))
				.data.split(/\r?\n\r?\n/);
			return [entranceSong, offertorySong, communionSong, sendingSong];
		},
		getNextWednesday() {
			const nextWednesday = new Date();
			while (nextWednesday.getDay() !== 3)
				nextWednesday.setDate(nextWednesday.getDate() + 1);
			return nextWednesday;
		},
		getNextWednesdayDigits() {
			const nextWednesday = this.getNextWednesday();
			const year = nextWednesday.getFullYear();
			const month = nextWednesday.getMonth() + 1;
			const day = nextWednesday.getDate();

			let str = year + "-";
			if (month < 10) 
				str += "0";
			str += month + "-";
			if (day < 10) 
				str += "0";
			str += day;
			return str;
		},
		getNextWednesdayFrench() {
			const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
			const nextWednesday = this.getNextWednesday();
			const year = nextWednesday.getFullYear();
			const month = months[nextWednesday.getMonth()];
			const day = nextWednesday.getDate();
			return "Mercredi " + day + " " + month + " " + year;
		},
		async getPsalmChorus() {
			const endpoint = "https://api.aelf.org/v1/messes/" + this.getNextWednesdayDigits() + "/france";
			const { data } = await axios.get(endpoint);
			for (let lect of data.messes[0].lectures)
				if (lect.type == "psaume")
					return lect.refrain_psalmique.replaceAll(/(<[^>]+>)/g, "");
			return null;
		},
		async savePdf() {
			const psalmChorus = await this.getPsalmChorus();
			const [entranceSong, offertorySong, communionSong, sendingSong] = await this.getNonOrdinarySongs();
			
			this.doc = new jsPDF({
				orientation: "l",
				format: "a4",
			});
			const width = this.doc.internal.pageSize.getWidth();
			const height = this.doc.internal.pageSize.getHeight();
			this.doc.setTextColor(255, 255, 255);
			
			// introduction
			this.doc.setFillColor(33, 33, 33);
			this.doc.rect(0, 0, width, height, 'F');
			this.doc.setFontSize(60);
			const title = "Messe du " + this.getNextWednesdayFrench();
			const splitTitle = this.doc.splitTextToSize(title, width - 40);
			this.doc.text(splitTitle, width/2, height/3, { align: 'center' });
			this.doc.setFontSize(30);
			this.doc.setTextColor(171, 171, 171);
			this.doc.text("Aumônerie de Beaulieu", width/2, 2*height/3, { align: 'center' });
			this.doc.setTextColor(255, 255, 255);
			
			// entrance
			this.addPage();
			this.addNonOrdinarySong(this.entrance, entranceSong);

			// empty
			this.addPage();

			// kyrie
			this.addPage();
			this.addOrdinarySong("Kyrie", KYRIE_LATIN, KYRIE_FRENCH);

			// empty
			this.addPage();

			// psalm
			this.addPage();
			this.doc.setFontSize(30);
			const splitPsalmChorus = this.doc.splitTextToSize(psalmChorus, width - 40);
			this.doc.text(splitPsalmChorus, width/2, height/2, { align: 'center' });

			// empty
			this.addPage();

			// universal prayer
			this.addPage();
			this.doc.setFontSize(30);
			const splitUniversalPrayer = this.doc.splitTextToSize(this.universalPrayer, width - 40);
			this.doc.text(splitUniversalPrayer, width/2, height/2, { align: 'center' });

			// empty
			this.addPage();

			// offertory
			this.addPage();
			this.addNonOrdinarySong(this.offertory, offertorySong);

			// empty
			this.addPage();

			// sanctus
			this.addPage();
			this.addOrdinarySong("Sanctus", SANCTUS_LATIN, SANCTUS_FRENCH);

			// empty
			this.addPage();

			// agnus
			this.addPage();
			this.addOrdinarySong("Agnus Dei", AGNUS_LATIN, AGNUS_FRENCH);

			// empty
			this.addPage();

			// communion
			this.addPage();
			this.addNonOrdinarySong(this.communion, communionSong);

			// empty
			this.addPage();

			// sending
			this.addPage();
			this.addNonOrdinarySong(this.sending, sendingSong);

			// conclusion
			this.addPage();
			this.doc.setFontSize(30);
			this.doc.text("Bonne soirée, et souriez, Jésus vous aime !", width/2, height/2, { align: 'center' });

			const name = "Messe du " + this.getNextWednesdayDigits();
			this.doc.save(name);
		}
	}
};
</script>

<style>
</style>
