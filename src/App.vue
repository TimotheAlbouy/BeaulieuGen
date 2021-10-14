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
			sendingOptions: []
		};
	},
	async mounted() {
		const endpoint = "/textes/";
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
		addSong(title, song) {
			const width = this.doc.internal.pageSize.getWidth();
			const height = this.doc.internal.pageSize.getHeight();
			this.doc.setFontSize(30);
			this.doc.text(title, 10, 20);
			this.doc.setFontSize(20);
			if (song.length == 1) {
				const splitP1 = this.doc.splitTextToSize(song[0], width - 40);
				this.addParagraph(splitP1, 20, height/3);
			} else if (song.length == 2) {
				const splitP1 = this.doc.splitTextToSize(song[0], width - 40);
				this.addParagraph(splitP1, 20, height/3);
				const splitP2 = this.doc.splitTextToSize(song[1], width - 40);
				this.addParagraph(splitP2, 20, 2*height/3);
			} else if (song.length == 3) {
				const splitP1 = this.doc.splitTextToSize(song[0], width - 40);
				this.addParagraph(splitP1, 20, height/4);
				const splitP2 = this.doc.splitTextToSize(song[1], width - 40);
				this.addParagraph(splitP2, 20, height/2);
				const splitP3 = this.doc.splitTextToSize(song[2], width - 40);
				this.addParagraph(splitP3, 20, 3*height/4);
			} else if (song.length >= 4) {
				const splitP1 = this.doc.splitTextToSize(song[0], width/2 - 30);
				this.addParagraph(splitP1, 20, 40);
				const splitP2 = this.doc.splitTextToSize(song[1], width/2 - 30);
				this.addParagraph(splitP2, 20, height/2 + 10);
				const splitP3 = this.doc.splitTextToSize(song[2], width/2 - 30);
				this.addParagraph(splitP3, width/2 + 10, 40);
				const splitP4 = this.doc.splitTextToSize(song[3], width/2 - 30);
				this.addParagraph(splitP4, width/2 + 10, height/2 + 10);
			}

		},
		addParagraph(paragraph, x, y) {
			this.doc.setFontSize(20);
			const isChorus = paragraph[0].startsWith("R.");
			if (isChorus)
				this.doc.setFont(undefined, "bold");
			this.doc.text(paragraph, x, y);
			if (isChorus)
				this.doc.setFont(undefined, "normal");
		},
		async getSongs() {
			const endpoint = "/textes/chants/";
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
		async getPsalmChorus() {
			const endpoint = "https://api.aelf.org/v1/messes/" + this.getNextWednesday() + "/france";
			const { data } = await axios.get(endpoint);

			for (let lect of data.messes[0].lectures) {
				if (lect.type == "psaume") {
					let lenChorus = lect.refrain_psalmique.length;
					return lect.refrain_psalmique.substring(3, lenChorus - 4);
				}
			}

			return null;
		},
		async savePdf() {
			const nextWednesday = this.getNextWednesday();
			const psalmChorus = await this.getPsalmChorus();
			const [entranceSong, offertorySong, communionSong, sendingSong] = await this.getSongs();
			
			this.doc = new jsPDF({
				orientation: "l",
				format: "a4",
			});
			const width = this.doc.internal.pageSize.getWidth();
			const height = this.doc.internal.pageSize.getHeight();
			this.doc.setTextColor(255, 255, 255);
			
			// page 1 (introduction)
			this.doc.setFillColor(33, 33, 33);
			this.doc.rect(0, 0, width, height, 'F');
			this.doc.setFontSize(60);
			this.doc.text("Messe du " + nextWednesday, width/2, height/3, { align: 'center' });
			this.doc.setFontSize(30);
			this.doc.text("Aumônerie de Beaulieu", width/2, height/2, { align: 'center' });
			
			// page 2 (entrance)
			this.addPage();
			this.addSong(this.entrance, entranceSong);

			// page 3 (empty)
			this.addPage();

			// page 4 (psalm)
			this.addPage();
			this.doc.setFontSize(30);
			this.doc.text(psalmChorus, width/2, height/2, { align: 'center' });

			// page 5 (empty)
			this.addPage();

			// page 6 (universal prayer)
			this.addPage();
			this.doc.setFontSize(30);
			this.doc.text(this.universalPrayer, width/2, height/2, { align: 'center' });

			// page 7 (empty)
			this.addPage();

			// page 8 (offertory)
			this.addPage();
			this.addSong(this.offertory, offertorySong);

			// page 9 (empty)
			this.addPage();

			// page 10 (communion)
			this.addPage();
			this.addSong(this.communion, communionSong);

			// page 11 (empty)
			this.addPage();

			// page 12 (sending)
			this.addPage();
			this.addSong(this.sending, sendingSong);

			// page 13 (conclusion)
			this.addPage();
			this.doc.setFontSize(30);
			this.doc.text("Bonne soirée, et souriez, Jésus vous aime !", width/2, height/2, { align: 'center' });

			const name = "Messe du " + nextWednesday;
			this.doc.save(name);
		}
	}
};
</script>

<style>
</style>
